import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrencyRates } from "@/lib/currency";

/**
 * The rate cache lives in module scope, so every test re-imports the module to
 * start from a clean slate — otherwise the first test's request would satisfy
 * all the others.
 */
async function importFreshLoadRates() {
  vi.resetModules();
  const mod = await import("@/lib/currency/use-display-currency");
  return mod.loadRates;
}

function mockFetchOnce(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadRates", () => {
  it("collapses concurrent callers onto a single request", async () => {
    const fetchMock = mockFetchOnce({ rates: { EUR: 0.9 } });
    const loadRates = await importFreshLoadRates();

    const rates = await Promise.all([
      loadRates(),
      loadRates(),
      loadRates(),
      loadRates(),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const result of rates) {
      expect(result).toEqual({ EUR: 0.9 });
    }
  });

  it("serves later callers from the same request", async () => {
    const fetchMock = mockFetchOnce({ rates: { EUR: 0.9 } });
    const loadRates = await importFreshLoadRates();

    await loadRates();
    const second = await loadRates();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual({ EUR: 0.9 });
  });

  it("does not retry after a failed response", async () => {
    const fetchMock = mockFetchOnce({ rates: {} }, false);
    const loadRates = await importFreshLoadRates();

    expect(await loadRates()).toEqual({});
    expect(await loadRates()).toEqual({});
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resolves to empty rates when the request throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);
    const loadRates = await importFreshLoadRates();

    const rates: CurrencyRates = await loadRates();

    expect(rates).toEqual({});
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});