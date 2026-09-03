import { describe, expect, it } from "vitest";
import { formatDate, formatMoneyDelta, formatRateDelta } from "@/lib/format";

describe("formatMoneyDelta", () => {
  const usd = (amount: number) => `$${amount.toFixed(2)}`;

  it("formats a positive delta with sign and formatted amount", () => {
    expect(formatMoneyDelta({ value: 25.5, percentage: null }, usd)).toBe(
      "+$25.50"
    );
  });

  it("formats a negative delta with a minus sign", () => {
    expect(formatMoneyDelta({ value: -10, percentage: null }, usd)).toBe(
      "−$10.00"
    );
  });

  it("formats a zero delta without a sign", () => {
    expect(formatMoneyDelta({ value: 0, percentage: null }, usd)).toBe("$0.00");
  });

  it("appends the percentage when present", () => {
    expect(formatMoneyDelta({ value: 20, percentage: 15 }, usd)).toBe(
      "+$20.00 (+15.0%)"
    );
  });

  it("handles a negative percentage", () => {
    expect(formatMoneyDelta({ value: -20, percentage: -5 }, usd)).toBe(
      "−$20.00 (−5.0%)"
    );
  });
});

describe("formatRateDelta", () => {
  it("formats a positive ratio as percentage points", () => {
    expect(formatRateDelta({ value: 0.15, percentage: null })).toBe("+15.0 pp");
  });

  it("formats a negative ratio as percentage points", () => {
    expect(formatRateDelta({ value: -0.1, percentage: null })).toBe("−10.0 pp");
  });

  it("formats a zero ratio without a sign", () => {
    expect(formatRateDelta({ value: 0, percentage: null })).toBe("0.0 pp");
  });
});

describe("formatDate", () => {
  it("formats a valid ISO date", () => {
    const result = formatDate("2026-08-15T12:00:00Z", "en-US");
    expect(result).toBe("Aug 15, 2026");
  });

  it("renders an em dash for an invalid date", () => {
    expect(formatDate("not-a-date", "en-US")).toBe("—");
  });

  it("renders an em dash for an empty string", () => {
    expect(formatDate("", "en-US")).toBe("—");
  });
});
