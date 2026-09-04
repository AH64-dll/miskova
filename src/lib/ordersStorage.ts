import { promises as fs } from "fs";
import path from "path";
import { StoredOrderSchema, type StoredOrder } from "./orderSchemas";

export class OrderValidationError extends Error {
  field: string;

  constructor(message: string, field: string) {
    super(message);
    this.name = "OrderValidationError";
    this.field = field;
  }
}

export class OrderStorageError extends Error {
  constructor(message = "Order store is unavailable.") {
    super(message);
    this.name = "OrderStorageError";
  }
}

function resolveStorePath(): string {
  const override = process.env.ORDERS_STORE_PATH;
  if (override && override.trim()) return override;
  return path.join(process.cwd(), ".data", "orders.json");
}

// Serialize all writes through one chain so concurrent requests never clobber each other.

// Cross-process safety: exclusive lock file with stale-lock recovery.
async function withFileLock<T>(filePath: string, task: () => Promise<T>): Promise<T> {
  const lockPath = `${filePath}.lock`;
  const staleMs = 10_000;
  const deadline = Date.now() + 10_000;
  for (;;) {
    try {
      const handle = await fs.open(lockPath, "wx");
      try {
        await handle.writeFile(`${process.pid}:${Date.now()}`);
      } finally {
        await handle.close();
      }
      try {
        return await task();
      } finally {
        try {
          await fs.unlink(lockPath);
        } catch {
          /* already released */
        }
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== "EEXIST") throw error;
      try {
        const raw = await fs.readFile(lockPath, "utf8");
        const stamp = Number(raw.split(":")[1]);
        if (Number.isFinite(stamp) && Date.now() - stamp > staleMs) {
          await fs.unlink(lockPath);
          continue;
        }
      } catch {
        /* lock vanished; retry */
      }
      if (Date.now() > deadline) {
        throw new OrderStorageError("Order store is busy. Please try again.");
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

async function readStore(): Promise<StoredOrder[]> {
  const storePath = resolveStorePath();
  let raw: string;
  try {
    raw = await fs.readFile(storePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw new OrderStorageError();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new OrderStorageError();
  }
  if (!Array.isArray(parsed)) throw new OrderStorageError();
  const orders: StoredOrder[] = [];
  for (const entry of parsed) {
    const result = StoredOrderSchema.safeParse(entry);
    if (!result.success) throw new OrderStorageError();
    orders.push(result.data);
  }
  return orders;
}

async function writeStore(orders: StoredOrder[]): Promise<void> {
  const storePath = resolveStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  const tmp = `${storePath}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(orders, null, 2), "utf8");
    await fs.rename(tmp, storePath);
  } catch {
    try {
      await fs.unlink(tmp);
    } catch {
      /* cleanup best-effort */
    }
    throw new OrderStorageError();
  }
}

export async function getOrders(): Promise<StoredOrder[]> {
  return readStore();
}

export function makeOrderRef(now = Date.now()): string {
  return `MKV-${now.toString(36).toUpperCase()}`;
}

export async function addOrder(order: Omit<StoredOrder, "createdAt"> & { createdAt?: string }): Promise<StoredOrder> {
  const record: StoredOrder = {
    ...order,
    createdAt: order.createdAt ?? new Date().toISOString(),
  };
  const parsed = StoredOrderSchema.safeParse(record);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = typeof issue?.path[0] === "string" ? String(issue.path[0]) : "order";
    throw new OrderValidationError(issue?.message ?? "Invalid order.", field);
  }
  return await withFileLock(resolveStorePath(), async () => {
    const orders = await readStore();
    orders.unshift(parsed.data);
    await writeStore(orders);
    return parsed.data;
  });
}
