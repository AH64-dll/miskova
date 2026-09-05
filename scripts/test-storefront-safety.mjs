import assert from "node:assert/strict";
import { test, after } from "node:test";
import { registerHooks } from "node:module";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && !path.extname(specifier) && context.parentURL?.endsWith(".ts")) {
      return next(`${specifier}.ts`, context);
    }
    return next(specifier, context);
  },
});
const { addOrder, getOrders, makeOrderRef, OrderStorageError } = await import("../src/lib/ordersStorage.ts");
const { OrderSubmissionSchema } = await import("../src/lib/orderSchemas.ts");
const { readJsonBody } = await import("../src/lib/requestBody.ts");
const { rateLimit } = await import("../src/lib/rateLimit.ts");
const temp = await mkdtemp(path.join(tmpdir(), "miskova-safety-"));
process.env.ORDERS_STORE_PATH = path.join(temp, "fresh", "orders.json");
after(() => rm(temp, { recursive: true, force: true }));
const customer = { name: "Test Patron", phone: "01012345678", governorate: "Cairo", address: "10 Test Street", notes: "" };

test("login burst protection blocks excess attempts and resets after its window", () => {
  assert.equal(rateLimit("test-login", 2, 60_000, 1000), 0);
  assert.equal(rateLimit("test-login", 2, 60_000, 1001), 0);
  assert.equal(rateLimit("test-login", 2, 60_000, 2000), 59);
  assert.equal(rateLimit("test-login", 2, 60_000, 61000), 0);
});

test("references stay unique within the same millisecond", () => {
  const refs = Array.from({ length: 10000 }, () => makeOrderRef(123456789));
  assert.equal(new Set(refs).size, refs.length);
  assert.ok(refs.every((ref) => ref.length <= 32));
});

test("normalize before validation; reject blank names, addresses, invalid phones", () => {
  const submit = (patch) => OrderSubmissionSchema.safeParse({ items: [{ slug: "Liquid-Gold", qty: 1 }], customer: { ...customer, ...patch } });
  assert.equal(submit({ name: "   " }).success, false);
  assert.equal(submit({ address: "\u0000     " }).success, false);
  assert.equal(submit({ phone: "abcdefghi" }).success, false);
  assert.equal(submit({ name: "  Patron  " }).data.customer.name, "Patron");
});

test("streaming limit works without Content-Length", async () => {
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(17000)); controller.close(); } });
  const request = new Request("http://localhost/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body, duplex: "half" });
  await assert.rejects(readJsonBody(request), (error) => error.status === 413);
  await assert.rejects(readJsonBody(new Request("http://localhost", { method: "POST", body: "{}" })), (error) => error.status === 415);
  await assert.rejects(readJsonBody(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" })), (error) => error.status === 400);
});

test("fresh storage creates parent directory; concurrent orders survive; corruption fails closed", async () => {
  const records = Array.from({ length: 12 }, () => ({ ref: makeOrderRef(), items: [{ slug: "Liquid-Gold", name: "Liquid Gold", unitPrice: 450, qty: 1 }], total: 450, customer }));
  await Promise.all(records.map((record) => addOrder(record)));
  assert.equal((await getOrders()).length, records.length);
  await assert.rejects(addOrder(records[0]), OrderStorageError);
  assert.equal((await getOrders()).length, records.length);
  await writeFile(process.env.ORDERS_STORE_PATH, "corrupt");
  await assert.rejects(addOrder({ ...records[0], ref: makeOrderRef() }), OrderStorageError);
  assert.equal(await readFile(process.env.ORDERS_STORE_PATH, "utf8"), "corrupt");
});
