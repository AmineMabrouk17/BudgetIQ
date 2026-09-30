import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetJwksCache, getJwks } from "@/lib/auth/jwks";

const SUPABASE_URL = "https://project.supabase.co";

function jwksResponse(keys: unknown[]) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({ keys }),
  } as unknown as Response;
}

const KEY_A = { kid: "key-a", kty: "EC", key_ops: ["verify"] };
const KEY_B = { kid: "key-b", kty: "EC", key_ops: ["verify"] };

beforeEach(() => {
  __resetJwksCache();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getJwks", () => {
  it("fetches the key set from the project's well-known endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jwksResponse([KEY_A]));
    vi.stubGlobal("fetch", fetchMock);

    const jwks = await getJwks(SUPABASE_URL, "key-a");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://project.supabase.co/auth/v1/.well-known/jwks.json",
      { headers: { Accept: "application/json" } }
    );
    expect(jwks.keys).toEqual([KEY_A]);
  });

  it("strips a trailing slash from the project URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jwksResponse([KEY_A]));
    vi.stubGlobal("fetch", fetchMock);

    await getJwks("https://project.supabase.co/", "key-a");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://project.supabase.co/auth/v1/.well-known/jwks.json"
    );
  });

  it("serves repeat lookups from memory instead of refetching", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jwksResponse([KEY_A]));
    vi.stubGlobal("fetch", fetchMock);

    const first = await getJwks(SUPABASE_URL, "key-a");
    const second = await getJwks(SUPABASE_URL, "key-a");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it("shares one download between concurrent lookups", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jwksResponse([KEY_A]));
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([
      getJwks(SUPABASE_URL, "key-a"),
      getJwks(SUPABASE_URL, "key-a"),
      getJwks(SUPABASE_URL, "key-a"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches when a token is signed by a key it has not seen", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jwksResponse([KEY_A]))
      .mockResolvedValueOnce(jwksResponse([KEY_A, KEY_B]));
    vi.stubGlobal("fetch", fetchMock);

    await getJwks(SUPABASE_URL, "key-a");
    const rotated = await getJwks(SUPABASE_URL, "key-b");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rotated.keys).toEqual([KEY_A, KEY_B]);
  });

  it("refetches rather than verifying against a stale key set", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jwksResponse([KEY_A]))
        .mockResolvedValueOnce(jwksResponse([KEY_A]));
      vi.stubGlobal("fetch", fetchMock);

      await getJwks(SUPABASE_URL, "key-a");
      vi.advanceTimersByTime(61 * 60 * 1000);
      await getJwks(SUPABASE_URL, "key-a");

      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws when the endpoint fails so callers fall back to the Auth API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      } as unknown as Response)
    );

    await expect(getJwks(SUPABASE_URL, "key-a")).rejects.toThrow(
      /Failed to fetch Supabase JWKS/
    );
  });

  it("throws when the endpoint returns an empty key set", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jwksResponse([])));

    await expect(getJwks(SUPABASE_URL, "key-a")).rejects.toThrow(
      /contained no keys/
    );
  });

  it("retries after a failure rather than caching the error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: "Error" })
      .mockResolvedValueOnce(jwksResponse([KEY_A]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getJwks(SUPABASE_URL, "key-a")).rejects.toThrow();
    await expect(getJwks(SUPABASE_URL, "key-a")).resolves.toEqual({
      keys: [KEY_A],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
