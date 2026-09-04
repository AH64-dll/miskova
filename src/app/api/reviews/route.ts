import { NextResponse } from "next/server";
import { calculateReviewStats } from "@/data/reviews";
import {
  addReview,
  getReviews,
  ReviewStorageError,
  ReviewValidationError,
} from "@/lib/reviewsStorage";
import { SubmissionSchema, normalizeText } from "@/lib/reviewSchemas";
import { getCatalog } from "@/lib/catalog";
import type { Review } from "@/types/reviews";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const SUBMIT_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;

const submitHits = new Map<string, number[]>();

function fingerprint(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip =
    forwarded ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  return `${ip}|${ua}`;
}

function prune(now: number): void {
  for (const [key, stamps] of submitHits) {
    const fresh = stamps.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) submitHits.delete(key);
    else submitHits.set(key, fresh);
  }
}

function submitAllowed(key: string, now: number): { allowed: boolean; retryAfter: number } {
  const stamps = (submitHits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (stamps.length >= SUBMIT_LIMIT) {
    const oldest = Math.min(...stamps);
    const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    return { allowed: false, retryAfter };
  }
  stamps.push(now);
  submitHits.set(key, stamps);
  return { allowed: true, retryAfter: 0 };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productSlug = searchParams.get("productSlug");
  const sortParam = searchParams.get("sort");
  const ratingParam = searchParams.get("rating");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  if (sortParam !== null && !["newest", "highest", "helpful"].includes(sortParam)) {
    return NextResponse.json({ success: false, error: "Invalid sort." }, { status: 400 });
  }

  let store: Review[];
  try {
    store = await getReviews();
  } catch (error) {
    if (error instanceof ReviewStorageError) {
      return NextResponse.json(
        { success: false, error: "Review store is unavailable." },
        { status: 503 },
      );
    }
    return NextResponse.json({ success: false, error: "Unable to load reviews." }, { status: 500 });
  }

  const productScoped =
    productSlug && productSlug !== "all"
      ? store.filter((r) => r.productSlug.toLowerCase() === productSlug.toLowerCase())
      : store;

  const stats = calculateReviewStats(productScoped);

  let filtered = [...productScoped];
  if (ratingParam !== null) {
    const ratingNum = Number.parseInt(ratingParam, 10);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ success: false, error: "Invalid rating." }, { status: 400 });
    }
    filtered = filtered.filter((r) => r.rating === ratingNum);
  }

  if (sortParam === "highest") {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortParam === "helpful") {
    filtered.sort((a, b) => b.helpfulCount - a.helpfulCount);
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : NaN;
  if (limitParam !== null && (!Number.isInteger(parsedLimit) || parsedLimit <= 0)) {
    return NextResponse.json({ success: false, error: "Invalid limit." }, { status: 400 });
  }
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 24;
  const parsedOffset = offsetParam ? Number.parseInt(offsetParam, 10) : NaN;
  if (offsetParam !== null && (!Number.isInteger(parsedOffset) || parsedOffset < 0)) {
    return NextResponse.json({ success: false, error: "Invalid offset." }, { status: 400 });
  }
  const offset = Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0;
  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit);

  return NextResponse.json(
    { success: true, data: paged satisfies Review[], stats, total },
    { headers: { "Cache-Control": "no-store" } },
  );
}

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

  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = typeof issue?.path[0] === "string" ? issue.path[0] : "form";
    return NextResponse.json(
      { success: false, error: issue?.message ?? "Invalid review.", field },
      { status: 400 },
    );
  }

  const now = Date.now();
  prune(now);
  const key = fingerprint(request);
  const gate = submitAllowed(key, now);
  if (!gate.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } },
    );
  }

  const catalog = await getCatalog();
  const validSlugs = new Set(catalog.products.map((p) => p.slug));

  try {
    const review = await addReview(
      {
        productSlug: parsed.data.productSlug,
        authorName: normalizeText(parsed.data.authorName),
        rating: parsed.data.rating,
        title: parsed.data.title ? normalizeText(parsed.data.title) : "",
        comment: normalizeText(parsed.data.comment),
        location: parsed.data.location ? normalizeText(parsed.data.location) : "",
      },
      validSlugs,
    );
    const store = await getReviews();
    const stats = calculateReviewStats(store);
    return NextResponse.json(
      { success: true, message: "Review successfully submitted.", data: review, stats },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ReviewValidationError) {
      return NextResponse.json(
        { success: false, error: error.message, field: error.field },
        { status: 400 },
      );
    }
    if (error instanceof ReviewStorageError) {
      return NextResponse.json({ success: false, error: "Review store is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: "Unable to submit review." }, { status: 500 });
  }
}
