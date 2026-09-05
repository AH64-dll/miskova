import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "node:crypto";
import { StoredOrderSchema, type OrderStatus, type PaymentStatus, type StoredOrder } from "./orderSchemas";

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

// Cross-process safety on a shared local filesystem: exclusive lock, fail closed on timeout.
async function withFileLock<T>(filePath: string, task: () => Promise<T>): Promise<T> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
  } catch {
    throw new OrderStorageError();
  }
  const lockPath = `${filePath}.lock`;
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
      if (code !== "EEXIST") {
        if (error instanceof OrderValidationError || error instanceof OrderStorageError) throw error;
        throw new OrderStorageError();
      }
      // Never steal a lock based on age: a slow writer may still own it.
      // After a process crash, remove the orphan lock only with writers stopped.
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
  return `MKV-${now.toString(36).toUpperCase()}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export type NewOrder = Omit<StoredOrder, "createdAt" | "status" | "paymentMethod" | "paymentStatus" | "paymentCollectedAt" | "statusUpdatedAt"> & {
  createdAt?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

export async function addOrder(order: NewOrder): Promise<StoredOrder> {
  const record: StoredOrder = {
    ...order,
    status: order.status ?? "pending",
    paymentMethod: "cod",
    paymentStatus: order.paymentStatus ?? "pending",
    paymentCollectedAt: null,
    statusUpdatedAt: null,
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
    if (orders.some((entry) => entry.ref === parsed.data.ref)) throw new OrderStorageError();
    orders.unshift(parsed.data);
    await writeStore(orders);
    return parsed.data;
  });
}

/** Admin transitions: status changes and COD payment collection. Single
    serialized read-modify-write through the same file lock as addOrder. */
export async function updateOrder(
  ref: string,
  patch: { status?: OrderStatus; paymentStatus?: PaymentStatus },
): Promise<StoredOrder | null> {
  return await withFileLock(resolveStorePath(), async () => {
    const orders = await readStore();
    const index = orders.findIndex((o) => o.ref === ref);
    if (index === -1) return null;
    const current = orders[index];
    const now = new Date().toISOString();
    const next: StoredOrder = {
      ...current,
      ...(patch.status ? { status: patch.status, statusUpdatedAt: now } : {}),
      ...(patch.paymentStatus === "collected"
        ? { paymentStatus: "collected", paymentCollectedAt: now }
        : {}),
      ...(patch.paymentStatus === "pending"
        ? { paymentStatus: "pending", paymentCollectedAt: null }
        : {}),
    };
    const parsed = StoredOrderSchema.safeParse(next);
    if (!parsed.success) throw new OrderStorageError();
    orders[index] = parsed.data;
    await writeStore(orders);
    return parsed.data;
  });
}
