"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function checkLoginRateLimit(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

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
