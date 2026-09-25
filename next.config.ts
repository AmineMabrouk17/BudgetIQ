import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

// Next.js dev server blocks non-localhost origins from loading dev resources
// (HMR, and it breaks client hydration) unless listed here. Loaded from
// ALLOWED_DEV_ORIGINS (comma-separated) so dev-only origins stay out of git.
function readAllowedDevOrigins(): string[] {
  const list = (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length > 0) return list;
  // Turbopack evaluates next.config.ts in a worker that does not have
  // .env.local loaded into process.env, so fall back to reading the file.
  try {
    const cwd = process.cwd();
    const file = join(cwd, ".env.local");
    const line = readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("ALLOWED_DEV_ORIGINS="));
    console.error("[next.config] debug cwd=", cwd, "line=", line);
    if (line) {
      return line
        .slice("ALLOWED_DEV_ORIGINS=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } catch (e) {
    console.error("[next.config] debug read error:", e);
  }
  return [];
}

const allowedDevOrigins = readAllowedDevOrigins();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;