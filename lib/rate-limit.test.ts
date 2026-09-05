import { afterEach, describe, expect, it, vi } from "vitest";

async function loadRateLimit() {
  vi.resetModules();
  const { rateLimit } = await import("@/lib/rate-limit");
  return rateLimit;
}

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  vi.resetModules();
});

describe("rateLimit (in-memory fallback)", () => {
  it("allows requests up to the limit and blocks on breach", async () => {
    const rateLimit = await loadRateLimit();

    const first = await rateLimit({
      prefix: "test",
      identifier: "user-1",
      limit: 3,
      window: 60,
    });
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(2);

    const second = await rateLimit({
      prefix: "test",
      identifier: "user-1",
      limit: 3,
      window: 60,
    });
    expect(second.success).toBe(true);

    const third = await rateLimit({
      prefix: "test",
      identifier: "user-1",
      limit: 3,
      window: 60,
    });
    expect(third.success).toBe(true);

    const blocked = await rateLimit({
      prefix: "test",
      identifier: "user-1",
      limit: 3,
      window: 60,
    });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("does not affect a different identifier", async () => {
    const rateLimit = await loadRateLimit();

    for (let i = 0; i < 4; i++) {
      await rateLimit({
        prefix: "test",
        identifier: "user-1",
        limit: 3,
        window: 60,
      });
    }

    const other = await rateLimit({
      prefix: "test",
      identifier: "user-2",
      limit: 3,
      window: 60,
    });
    expect(other.success).toBe(true);
    expect(other.remaining).toBe(2);
  });

  it("resets the window after it elapses", async () => {
    const rateLimit = await loadRateLimit();

    for (let i = 0; i < 3; i++) {
      await rateLimit({
        prefix: "test",
        identifier: "user-1",
        limit: 2,
        window: 60,
      });
    }

    const blocked = await rateLimit({
      prefix: "test",
      identifier: "user-1",
      limit: 2,
      window: 60,
    });
    expect(blocked.success).toBe(false);

    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 61_000);

    const afterReset = await rateLimit({
      prefix: "test",
      identifier: "user-1",
      limit: 2,
      window: 60,
    });
    expect(afterReset.success).toBe(true);
  });
});
