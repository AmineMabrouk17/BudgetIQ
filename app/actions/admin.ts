"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE_NAME = "admin_session_token";
// Simple fallback or read from env
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345";

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  return session === "authenticated";
}

export async function authenticateAdmin(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const password = formData.get("password") as string;

  if (!password) {
    return { ok: false, error: "Password is required." };
  }

  if (password !== ADMIN_PASSWORD) {
    return { ok: false, error: "Incorrect admin password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours session
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  revalidatePath("/admin");
}