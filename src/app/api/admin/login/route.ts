import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody, RequestBodyError } from "@/lib/requestBody";
import { rateLimit } from "@/lib/rateLimit";
import { ADMIN_COOKIE, SESSION_COOKIE_MAX_AGE, adminConfigured, sessionCookieFor, verifyAdminPassword } from "@/lib/adminAuth";

export const runtime = "nodejs";

const LoginBody = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ ok: false, error: "Admin access is not configured (set ADMIN_PASSWORD)." }, { status: 503 });
  }
  // A single merchant account: shared limit cannot be bypassed by spoofing IP headers.
  const retryAfter = rateLimit("admin-login", 10, 60_000);
  if (retryAfter) {
    return NextResponse.json({ ok: false, error: "Too many login attempts. Please wait a minute." }, {
      status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" },
    });
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
  const parsed = LoginBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Enter the admin password." }, { status: 400 });
  }
  if (!verifyAdminPassword(parsed.data.password)) {
    return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  const cookie = sessionCookieFor(parsed.data.password);
  res.cookies.set(ADMIN_COOKIE, cookie.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: cookie.maxAge,
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return res;
}
