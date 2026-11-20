import { afterEach, describe, expect, it } from "vitest";
import { resolveTrustedClientIp } from "@/lib/client-ip";

const originalEnv = { ...process.env };

function headers(values: Record<string, string | undefined>) {
  return {
    get(name: string) {
      return values[name] ?? values[name.toLowerCase()] ?? null;
    },
  };
}

afterEach(() => {
  process.env = { ...originalEnv };
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  delete process.env.TRUST_PROXY_HEADERS;
});

describe("resolveTrustedClientIp", () => {
  it("prefers Vercel-provided forwarded IP on Vercel", () => {
    process.env.VERCEL = "1";
    expect(
      resolveTrustedClientIp(
        headers({
          "x-vercel-forwarded-for": "203.0.113.10, 10.0.0.1",
          "x-forwarded-for": "198.51.100.9",
        })
      )
    ).toBe("203.0.113.10");
  });

  it("uses Cloudflare connecting IP when present", () => {
    expect(
      resolveTrustedClientIp(headers({ "cf-connecting-ip": "203.0.113.20" }))
    ).toBe("203.0.113.20");
  });

  it("does not trust generic forwarding headers unless explicitly enabled", () => {
    expect(
      resolveTrustedClientIp(
        headers({
          "x-real-ip": "203.0.113.30",
          "x-forwarded-for": "198.51.100.1, 198.51.100.2",
        })
      )
    ).toBe("unknown");
  });

  it("trusts proxy headers only when TRUST_PROXY_HEADERS=true", () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    expect(
      resolveTrustedClientIp(headers({ "x-real-ip": "203.0.113.30" }))
    ).toBe("203.0.113.30");

    expect(
      resolveTrustedClientIp(
        headers({ "x-forwarded-for": "198.51.100.1, 198.51.100.2" })
      )
    ).toBe("198.51.100.2");
  });

  it("returns unknown when no trusted source is available", () => {
    expect(resolveTrustedClientIp(headers({}))).toBe("unknown");
  });
});
