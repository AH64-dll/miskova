import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Admin session auth for the orders dashboard (EasyOrders-style merchant
 * flow). A single shared password from ADMIN_PASSWORD gates login; the
 * session is a signed token cookie: `issued.token` where token =
 * HMAC-SHA256(passwordHash, issued). The token is only computable with
 * the server-side password, so a forged cookie cannot validate. TTL 12h.
 * If ADMIN_PASSWORD is unset the whole surface reports unconfigured.
 */

export const ADMIN_COOKIE = "miskova_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const SESSION_COOKIE_MAX_AGE = SESSION_TTL_MS / 1000;

function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  return value && value.trim() ? value.trim() : null;
}

export function adminConfigured(): boolean {
  return adminPassword() !== null;
}

function passwordHash(password: string): string {
  return createHash("sha256").update(`miskova-admin:${password}`).digest("hex");
}

function tokenFor(password: string, issued: string): string {
  return createHmac("sha256", passwordHash(password)).update(issued).digest("hex");
}

/** Timing-safe password check against ADMIN_PASSWORD. */
export function verifyAdminPassword(password: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  const a = createHash("sha256").update(password).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function sessionCookieFor(password: string): { value: string; maxAge: number } {
  const issued = Date.now().toString(36);
  return { value: `${issued}.${tokenFor(password, issued)}`, maxAge: SESSION_TTL_MS / 1000 };
}

export async function isAdminRequest(): Promise<boolean> {
  const password = adminPassword();
  if (!password) return false;
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value ?? "";
  const dot = raw.indexOf(".");
  if (dot <= 0) return false;
  const issued = raw.slice(0, dot);
  if (!/^[0-9a-z]+$/.test(issued)) return false;
  const timestamp = Number.parseInt(issued, 36);
  const age = Date.now() - timestamp;
  if (!Number.isSafeInteger(timestamp) || age < 0 || age > SESSION_TTL_MS) return false;
  const provided = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(tokenFor(password, issued));
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
