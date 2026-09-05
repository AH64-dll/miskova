import { NextResponse } from "next/server";
import { readJsonBody, RequestBodyError } from "@/lib/requestBody";
import { brand, effectivePrice, products } from "@/data/products";
import { addOrder, makeOrderRef, OrderStorageError, OrderValidationError } from "@/lib/ordersStorage";
import { isValidEgPhone, normalizeText, OrderSubmissionSchema } from "@/lib/orderSchemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof RequestBodyError ? error.message : "Unable to read request." },
      { status: error instanceof RequestBodyError ? error.status : 400 },
    );
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
    const product = bySlug.get(line.slug);
    if (!product || product.price == null || effectivePrice(product) <= 0) {
      return NextResponse.json(
        { success: false, error: "This fragrance is unavailable for checkout. Please contact us.", field: "items" },
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
      { status: 201, headers: { "Cache-Control": "no-store" } },
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
