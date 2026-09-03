import { describe, expect, it } from "vitest";
import {
  BASE_CURRENCY,
  CURRENCY_RATES_TTL_MS,
  convertFromUsd,
  formatCurrency,
  isRateStale,
  needsRateRefresh,
  pickRates,
  ratesFromRows,
} from "@/lib/currency";
import type { CurrencyRateRow, CurrencyRates } from "@/lib/currency";

describe("convertFromUsd", () => {
  it("multiplies the base amount by the rate", () => {
    expect(convertFromUsd(100, "EUR", { EUR: 0.9 })).toBe(90);
  });

  it("returns the base amount when no rate exists", () => {
    expect(convertFromUsd(100, "EUR", {})).toBe(100);
  });

  it("returns the base amount for an unknown currency code", () => {
    expect(convertFromUsd(100, "XXX", { EUR: 0.9 })).toBe(100);
  });

  it("ignores zero, negative, and non-finite rates", () => {
    const rates = { EUR: 0, GBP: -2, JPY: Number.NaN };
    expect(convertFromUsd(100, "EUR", rates)).toBe(100);
    expect(convertFromUsd(100, "GBP", rates)).toBe(100);
    expect(convertFromUsd(100, "JPY", rates)).toBe(100);
  });
});

describe("formatCurrency", () => {
  it("formats the base currency without conversion", () => {
    expect(formatCurrency(12.5, "USD", {})).toBe("$12.50");
  });

  it("converts and formats in the chosen currency", () => {
    expect(formatCurrency(100, "EUR", { EUR: 0.9 })).toBe("€90.00");
  });

  it("formats a currency without minor units", () => {
    expect(formatCurrency(100, "JPY", { JPY: 150 })).toBe("¥15,000");
  });

  it("falls back to the base amount when no rate is available", () => {
    expect(formatCurrency(100, "EUR", {})).toBe("€100.00");
  });

  it("falls back to the base currency for an unknown code", () => {
    expect(formatCurrency(5, "XXX", {})).toBe("$5.00");
  });
});

describe("isRateStale", () => {
  const now = new Date("2026-08-15T12:00:00Z");

  it("treats a recent fetch as fresh", () => {
    const fetched = new Date(now.getTime() - 3_600_000);
    expect(isRateStale(fetched, now, CURRENCY_RATES_TTL_MS)).toBe(false);
  });

  it("treats a fetch older than the TTL as stale", () => {
    const fetched = new Date(now.getTime() - CURRENCY_RATES_TTL_MS - 1);
    expect(isRateStale(fetched, now, CURRENCY_RATES_TTL_MS)).toBe(true);
  });

  it("treats a fetch exactly at the TTL boundary as fresh", () => {
    const fetched = new Date(now.getTime() - CURRENCY_RATES_TTL_MS);
    expect(isRateStale(fetched, now, CURRENCY_RATES_TTL_MS)).toBe(false);
  });

  it("treats an unparseable date as stale", () => {
    expect(isRateStale("not-a-date", now)).toBe(true);
  });

  it("respects a custom TTL", () => {
    const fetched = new Date(now.getTime() - 1_000);
    expect(isRateStale(fetched, now, 500)).toBe(true);
  });
});

describe("needsRateRefresh", () => {
  const now = new Date("2026-08-15T12:00:00Z");
  const freshRow = (currency: string): CurrencyRateRow => ({
    currency,
    rate_to_usd: 1,
    fetched_at: new Date(now.getTime() - 3_600_000).toISOString(),
  });

  it("does not refresh when every wanted currency is fresh", () => {
    const rows = ["USD", "EUR"].map(freshRow);
    expect(needsRateRefresh(rows, ["USD", "EUR"], now)).toBe(false);
  });

  it("refreshes when any wanted currency is stale", () => {
    const rows = [
      freshRow("USD"),
      {
        currency: "EUR",
        rate_to_usd: 1,
        fetched_at: new Date(now.getTime() - 200_000_000).toISOString(),
      },
    ];
    expect(needsRateRefresh(rows, ["USD", "EUR"], now)).toBe(true);
  });

  it("refreshes when a wanted currency has no row", () => {
    const rows = [freshRow("USD")];
    expect(needsRateRefresh(rows, ["USD", "EUR"], now)).toBe(true);
  });

  it("refreshes when there are no rows at all", () => {
    expect(needsRateRefresh([], ["USD"], now)).toBe(true);
  });
});

describe("ratesFromRows", () => {
  it("maps rows to a code-to-rate record", () => {
    const rows: CurrencyRateRow[] = [
      { currency: "USD", rate_to_usd: 1, fetched_at: "2026-08-15T00:00:00Z" },
      { currency: "EUR", rate_to_usd: 0.9, fetched_at: "2026-08-15T00:00:00Z" },
    ];
    expect(ratesFromRows(rows)).toEqual({ USD: 1, EUR: 0.9 });
  });

  it("drops rows with non-positive rates", () => {
    const rows: CurrencyRateRow[] = [
      { currency: "EUR", rate_to_usd: 0, fetched_at: "2026-08-15T00:00:00Z" },
      { currency: "GBP", rate_to_usd: 0.8, fetched_at: "2026-08-15T00:00:00Z" },
    ];
    expect(ratesFromRows(rows)).toEqual({ GBP: 0.8 });
  });
});

describe("pickRates", () => {
  const stored: CurrencyRates = { EUR: 0.9 };
  const fresh: CurrencyRates = { EUR: 0.88 };

  it("prefers freshly fetched rates over stored ones", () => {
    expect(pickRates(stored, fresh)).toEqual(fresh);
  });

  it("falls back to stored rates when the fetch fails", () => {
    expect(pickRates(stored, null)).toEqual(stored);
  });

  it("falls back to stored rates on an empty fetch result", () => {
    expect(pickRates(stored, {})).toEqual(stored);
  });

  it("returns the base currency alone when nothing is available", () => {
    expect(pickRates({}, null)).toEqual({});
    expect(pickRates({}, {})).toEqual({});
  });

  it("exposes the base currency constant for the base rate", () => {
    expect(BASE_CURRENCY).toBe("USD");
  });
});
