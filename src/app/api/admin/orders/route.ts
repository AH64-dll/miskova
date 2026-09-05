import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getOrders } from "@/lib/ordersStorage";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  try {
    const orders = await getOrders();
    return NextResponse.json({ ok: true, orders }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Order store is unavailable." }, { status: 503 });
  }
}
