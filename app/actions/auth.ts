"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIpFromHeaders } from "@/lib/client-ip";

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
    const ip = await getClientIpFromHeaders();

    const formBody = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") formBody.set("remoteip", ip);

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

export async function checkLoginRateLimit(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await getClientIpFromHeaders();

  const perIp = await rateLimit({
    prefix: "login-ip",
    identifier: ip,
    limit: 10,
    window: 60,
  });
  if (!perIp.success) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a minute and try again.",
    };
  }

  const perEmail = await rateLimit({
    prefix: "login-email",
    identifier: email.trim().toLowerCase(),
    limit: 5,
    window: 60,
  });
  if (!perEmail.success) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a minute and try again.",
    };
  }

  return { ok: true };
}