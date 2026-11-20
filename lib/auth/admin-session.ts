import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE_NAME = "admin_session_token";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export function getAdminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD?.trim();
  return value ? value : null;
}

function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function signIssuedAt(issuedAt: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(issuedAt).digest("hex");
}

export function createAdminSessionToken(secret: string): string {
  const issuedAt = Date.now().toString();
  const signature = signIssuedAt(issuedAt, secret);
  return `${issuedAt}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string,
  secret: string
): boolean {
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  if (!/^\d+$/.test(issuedAt)) return false;

  const issuedMs = Number(issuedAt);
  if (!Number.isFinite(issuedMs)) return false;

  const ageSeconds = (Date.now() - issuedMs) / 1000;
  if (ageSeconds < 0 || ageSeconds > ADMIN_SESSION_TTL_SECONDS) return false;

  const expected = signIssuedAt(issuedAt, secret);
  return timingSafeEqualString(signature, expected);
}

/**
 * Whether the request carries a valid admin session.
 *
 * Reads the signed, expiring admin session cookie issued at sign-in and
 * verifies it with the configured ADMIN_PASSWORD secret. This is the same
 * token check used for admin data access, so layout/UI visibility stays
 * consistent with enforcement and cannot be spoofed with a static value.
 *
 * Returns false when admin access is not configured or the token is missing,
 * malformed, expired, or invalid.
 */
export async function isAdminSession(): Promise<boolean> {
  const secret = getAdminPassword();
  if (!secret) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!session) return false;
  return verifyAdminSessionToken(session, secret);
}
