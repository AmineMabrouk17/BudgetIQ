import { afterEach, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { getPreviewMockSession } from "@/lib/auth/preview-bypass";

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
  delete process.env.VERCEL_ENV;
  delete process.env.PREVIEW_TEST_SECRET;
});

describe("getPreviewMockSession", () => {
  it("is inert outside preview environments", () => {
    process.env.PREVIEW_TEST_SECRET = "secret";
    const timestamp = String(Date.now());
    const signature = crypto
      .createHmac("sha256", "secret")
      .update(`preview-auth:${timestamp}`)
      .digest("hex");

    expect(
      getPreviewMockSession(
        headers({
          "x-test-auth-signature": signature,
          "x-test-auth-timestamp": timestamp,
        })
      )
    ).toBeNull();
  });

  it("accepts a valid signed preview request", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.PREVIEW_TEST_SECRET = "secret";
    const timestamp = String(Date.now());
    const signature = crypto
      .createHmac("sha256", "secret")
      .update(`preview-auth:${timestamp}`)
      .digest("hex");

    const session = getPreviewMockSession(
      headers({
        "x-test-auth-signature": signature,
        "x-test-auth-timestamp": timestamp,
      })
    );

    expect(session?.user.email).toBe("preview-bot@internal.test");
    expect(session?.user.role).toBe("user");
  });

  it("rejects stale, malformed, or incorrectly signed requests", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.PREVIEW_TEST_SECRET = "secret";
    const stale = String(Date.now() - 3 * 60 * 1000);
    const staleSig = crypto
      .createHmac("sha256", "secret")
      .update(`preview-auth:${stale}`)
      .digest("hex");

    expect(
      getPreviewMockSession(
        headers({ "x-test-auth-signature": staleSig, "x-test-auth-timestamp": stale })
      )
    ).toBeNull();

    const valid = String(Date.now());
    const wrongPurpose = crypto.createHmac("sha256", "secret").update(valid).digest("hex");
    expect(
      getPreviewMockSession(
        headers({ "x-test-auth-signature": wrongPurpose, "x-test-auth-timestamp": valid })
      )
    ).toBeNull();

    expect(
      getPreviewMockSession(
        headers({ "x-test-auth-signature": "bad", "x-test-auth-timestamp": "nope" })
      )
    ).toBeNull();
  });
});
