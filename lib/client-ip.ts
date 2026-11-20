import type { NextRequest } from "next/server";
import { headers } from "next/headers";

/**
 * Best-effort client IP for rate limiting and abuse controls.
 *
 * Spoofable forwarding headers are common when an app is reached directly, so
 * prefer the platform-populated single-hop headers first. When only
 * X-Forwarded-For is available, use the rightmost value (appended by the first
 * trusted proxy in the chain) rather than the leftmost client-supplied value.
 */
export function getClientIpFromRequest(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const vercelForwarded = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (vercelForwarded) return vercelForwarded.split(",")[0]!.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1]!;
  }

  return "unknown";
}

export async function getClientIpFromHeaders(): Promise<string> {
  const headerStore = await headers();
  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const vercelForwarded = headerStore.get("x-vercel-forwarded-for")?.trim();
  if (vercelForwarded) return vercelForwarded.split(",")[0]!.trim();

  const cfConnectingIp = headerStore.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1]!;
  }

  return "unknown";
}
