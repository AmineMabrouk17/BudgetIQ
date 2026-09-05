"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type VerifyTurnstileResult = { ok: true } | { ok: false; error: string };

const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_FAILURE_MESSAGE =
  "Security check failed. Please confirm you are not a robot and try again.";

export async function verifyTurnstile(
  token: string
): Promise<VerifyTurnstileResult> {
  if (!token) {
    return { ok: false, error: TURNSTILE_FAILURE_MESSAGE };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return {
      ok: false,
      error: "Bot protection isn't configured yet. Please try again later.",
    };
  }

  try {
    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for");
    const remoteip = forwardedFor?.split(",")[0]?.trim() || undefined;

    const formBody = new URLSearchParams({ secret, response: token });
    if (remoteip) formBody.set("remoteip", remoteip);

    const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });

    const result = (await response.json()) as { success?: boolean };
    if (!result.success) {
      return { ok: false, error: TURNSTILE_FAILURE_MESSAGE };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Something went wrong on our end. Please try again in a moment.",
    };
  }
}
