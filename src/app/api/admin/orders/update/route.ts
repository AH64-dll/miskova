import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/adminAuth";
import { updateOrder } from "@/lib/ordersStorage";
import { readJsonBody, RequestBodyError } from "@/lib/requestBody";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/orderSchemas";

export const runtime = "nodejs";

const PatchBody = z.object({
  ref: z.string().min(1).max(32),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
});

export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await readJsonBody(request, 1024);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof RequestBodyError ? error.message : "Invalid request." },
      { status: error instanceof RequestBodyError ? error.status : 400 },
    );
  }
  const parsed = PatchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid update payload." }, { status: 400 });
  }
  const { ref, status, paymentStatus } = parsed.data;
  if (!status && !paymentStatus) {
    return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 400 });
  }
  try {
    const order = await updateOrder(ref, { status, paymentStatus });
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, order }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Order store is unavailable." }, { status: 503 });
  }
}
