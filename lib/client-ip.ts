import type { NextRequest } from "next/server";
import { headers } from "next/headers";

type HeaderReader = {
  get(name: string): string | null;
};

function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

function firstIp(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

function rightmostIp(value: string | null): string | null {
  if (!value) return null;
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1]! : null;
}

/**
 * Resolve a client IP for rate limiting and abuse controls.
 *
 * Forwarding headers are attacker-controlled unless the request is guaranteed
 * to pass through a trusted proxy/CDN that strips and overwrites them. To avoid
 * trusting spoofable headers by default, we only use platform-guaranteed or
 * explicitly trusted sources:
 * - Vercel: x-vercel-forwarded-for (set by Vercel's edge)
 * - Cloudflare: cf-connecting-ip (set by Cloudflare when proxied)
 * - Self-hosted behind a trusted proxy: set TRUST_PROXY_HEADERS=true to trust
 *   x-real-ip and the rightmost X-Forwarded-For hop
 *
 * Returns "unknown" when no trusted source is available; callers should treat
 * that as a shared bucket for throttling rather than a unique client identity.
 */
export function resolveTrustedClientIp(headerStore: HeaderReader): string {
  if (isVercelRuntime()) {
    const vercelForwarded = firstIp(headerStore.get("x-vercel-forwarded-for"));
    if (vercelForwarded) return vercelForwarded;
  }

  const cfConnectingIp = headerStore.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const realIp = headerStore.get("x-real-ip")?.trim();
    if (realIp) return realIp;

    const forwarded = rightmostIp(headerStore.get("x-forwarded-for"));
    if (forwarded) return forwarded;
  }

  return "unknown";
}

export function getClientIpFromRequest(request: NextRequest): string {
  return resolveTrustedClientIp(request.headers);
}

export async function getClientIpFromHeaders(): Promise<string> {
  return resolveTrustedClientIp(await headers());
}
