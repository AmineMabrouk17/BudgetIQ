import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookies = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => cookies(),
}));

import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  isAdminSession,
  verifyAdminSessionToken,
} from "@/lib/auth/admin-session";

beforeEach(() => {
  vi.restoreAllMocks();
  delete process.env.ADMIN_PASSWORD;
  cookies.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("verifyAdminSessionToken", () => {
  it("accepts a token signed with the configured secret within TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const token = createAdminSessionToken("secret");
    expect(verifyAdminSessionToken(token, "secret")).toBe(true);
  });

  it("rejects expired, malformed, or wrongly signed tokens", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = createAdminSessionToken("secret");

    expect(verifyAdminSessionToken("garbage", "secret")).toBe(false);
    expect(verifyAdminSessionToken("abc.def", "secret")).toBe(false);
    expect(verifyAdminSessionToken(token, "other")).toBe(false);

    vi.setSystemTime(
      new Date(Date.now() + (ADMIN_SESSION_TTL_SECONDS + 1) * 1000)
    );
    expect(verifyAdminSessionToken(token, "secret")).toBe(false);
  });
});

describe("isAdminSession", () => {
  it("returns false when admin access is not configured", async () => {
    cookies.mockResolvedValue({ get: () => ({ value: "anything" }) });
    expect(await isAdminSession()).toBe(false);
  });

  it("rejects the legacy static cookie value", async () => {
    process.env.ADMIN_PASSWORD = "secret";
    cookies.mockResolvedValue({
      get: (name: string) =>
        name === ADMIN_SESSION_COOKIE_NAME ? { value: "authenticated" } : undefined,
    });

    expect(await isAdminSession()).toBe(false);
  });

  it("accepts a valid signed admin session cookie", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    process.env.ADMIN_PASSWORD = "secret";
    const token = createAdminSessionToken("secret");
    cookies.mockResolvedValue({
      get: (name: string) =>
        name === ADMIN_SESSION_COOKIE_NAME ? { value: token } : undefined,
    });

    expect(await isAdminSession()).toBe(true);
  });
});
