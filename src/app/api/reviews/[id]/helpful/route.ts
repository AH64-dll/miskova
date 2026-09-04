import { NextResponse } from "next/server";
import { ReviewStorageError, ReviewValidationError, voteHelpful } from "@/lib/reviewsStorage";

export const runtime = "nodejs";

const VOTE_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;

const voteHits = new Map<string, number[]>();

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

// Next.js 15+ async params
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const now = Date.now();
  const key = fingerprint(request);
  const stamps = (voteHits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (stamps.length >= VOTE_LIMIT) {
    const oldest = Math.min(...stamps);
    const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    return NextResponse.json(
      { success: false, error: "Too many votes. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  stamps.push(now);
  voteHits.set(key, stamps);

  const { id } = await params;
  try {
    const review = await voteHelpful(id);
    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found." }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: { id: review.id, helpfulCount: review.helpfulCount },
    });
  } catch (error) {
    if (error instanceof ReviewValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    if (error instanceof ReviewStorageError) {
      return NextResponse.json(
        { success: false, error: "Review store is unavailable." },
        { status: 503 },
      );
    }
    return NextResponse.json({ success: false, error: "Unable to vote." }, { status: 500 });
  }
}
