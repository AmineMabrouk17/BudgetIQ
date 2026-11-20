"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE_NAME = "admin_session_token";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getAdminPassword(): string | null {
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

function createSessionToken(secret: string): string {
  const issuedAt = Date.now().toString();
  const signature = signIssuedAt(issuedAt, secret);
  return `${issuedAt}.${signature}`;
}

function verifySessionToken(token: string, secret: string): boolean {
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  if (!/^\d+$/.test(issuedAt)) return false;

  const issuedMs = Number(issuedAt);
  if (!Number.isFinite(issuedMs)) return false;

  const ageSeconds = (Date.now() - issuedMs) / 1000;
  if (ageSeconds < 0 || ageSeconds > SESSION_TTL_SECONDS) return false;

  const expected = signIssuedAt(issuedAt, secret);
  return timingSafeEqualString(signature, expected);
}

export async function verifyAdminSession(): Promise<boolean> {
  const secret = getAdminPassword();
  if (!secret) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  if (!session) return false;
  return verifySessionToken(session, secret);
}

export async function authenticateAdmin(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const secret = getAdminPassword();
  if (!secret) {
    return {
      ok: false,
      error:
        "Admin access is not configured. Set ADMIN_PASSWORD on the server before using this page.",
    };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, error: "Password is required." };
  }

  if (!timingSafeEqualString(password, secret)) {
    return { ok: false, error: "Incorrect admin password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  revalidatePath("/admin");
}