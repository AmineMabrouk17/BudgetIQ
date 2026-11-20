"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  getAdminPassword,
  isAdminSession,
} from "@/lib/auth/admin-session";

function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function verifyAdminSession(): Promise<boolean> {
  return isAdminSession();
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
  cookieStore.set(
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionToken(secret),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_TTL_SECONDS,
    }
  );

  revalidatePath("/admin");
  return { ok: true };
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
  revalidatePath("/admin");
}
