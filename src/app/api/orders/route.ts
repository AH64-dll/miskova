import { NextResponse } from "next/server";
import { brand, effectivePrice, products } from "@/data/products";
import { addOrder, makeOrderRef, OrderStorageError, OrderValidationError } from "@/lib/ordersStorage";
import { isValidEgPhone, normalizeText, OrderSubmissionSchema } from "@/lib/orderSchemas";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return NextResponse.json(
      { success: false, error: "Content-Type must be application/json." },
      { status: 415 },
    );
  }

  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: "Request body too large." }, { status: 413 });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ success: false, error: "Unable to read request." }, { status: 400 });
  }
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: "Request body too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = OrderSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field =
      issue?.path.length && typeof issue.path[0] === "string" ? String(issue.path[0]) : "order";
    return NextResponse.json(
      { success: false, error: issue?.message ?? "Invalid order.", field },
      { status: 400 },
    );
  }

  // Reject duplicate slugs (distinct-line cap is enforced by the 1..10 schema bound).
  const slugs = parsed.data.items.map((l) => l.slug);
  if (new Set(slugs).size !== slugs.length) {
    return NextResponse.json(
      { success: false, error: "Duplicate items in order.", field: "items" },
      { status: 400 },
    );
  }

  // Resolve prices server-side from the catalog; never trust client totals.
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  for (const line of parsed.data.items) {
    if (!bySlug.has(line.slug)) {
      return NextResponse.json(
        { success: false, error: `Unknown product: ${line.slug}.`, field: "items" },
        { status: 400 },
      );
    }
  }

  const c = parsed.data.customer;
  const name = normalizeText(c.name).trim();
  const phone = normalizeText(c.phone).trim();
  const address = normalizeText(c.address).trim();
  const notes = c.notes ? normalizeText(c.notes).trim() : "";
  if (!isValidEgPhone(phone)) {
    return NextResponse.json(
      { success: false, error: "Please enter a valid phone number.", field: "customer" },
      { status: 400 },
    );
  }

  const lines = parsed.data.items.map((l) => {
    const p = bySlug.get(l.slug)!;
    return { slug: l.slug, qty: l.qty, unitPrice: effectivePrice(p), name: p.name };
  });
  const total = lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);
  const ref = makeOrderRef();
  const freeShipping = total >= brand.freeShippingThreshold;

  try {
    const order = await addOrder({
      ref,
      items: lines,
      total,
      customer: { name, phone, governorate: c.governorate, address, notes },
    });
    return NextResponse.json(
      { ok: true, ref: order.ref, total: order.total, freeShipping },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json(
        { success: false, error: error.message, field: error.field },
        { status: 400 },
      );
    }
    if (error instanceof OrderStorageError) {
      return NextResponse.json({ success: false, error: "Order store is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: "Unable to place order." }, { status: 500 });
  }
}
