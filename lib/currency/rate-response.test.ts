import { describe, expect, it } from "vitest";
import { parseRatesResponse } from "@/lib/currency/rate-response";

function payload(rates: Record<string, unknown>) {
  return { result: "success", base_code: "USD", rates };
}

describe("parseRatesResponse", () => {
  it("keeps supported codes and always pins USD to 1", () => {
    const result = parseRatesResponse(
      payload({ USD: 1, EUR: 0.9, TND: 3.05, JPY: 150, XXX: 42 })
    );

    expect(result).toEqual({ USD: 1, EUR: 0.9, TND: 3.05, JPY: 150 });
  });

  it("accepts numeric strings from the provider", () => {
    expect(parseRatesResponse(payload({ EUR: "0.91" }))).toEqual({
      USD: 1,
      EUR: 0.91,
    });
  });

  it("drops zero, negative, non-finite and non-numeric rates", () => {
    const result = parseRatesResponse(
      payload({ EUR: 0, GBP: -2, JPY: "nope", CAD: null, CHF: 0.84 })
    );

    expect(result).toEqual({ USD: 1, CHF: 0.84 });
  });

  it("rejects a failed result, a different base, or a missing rates object", () => {
    expect(parseRatesResponse({ result: "error", base_code: "USD", rates: {} })).toBeNull();
    expect(
      parseRatesResponse({ result: "success", base_code: "EUR", rates: {} })
    ).toBeNull();
    expect(parseRatesResponse({ result: "success", base_code: "USD" })).toBeNull();
  });

  it("rejects a payload with no usable non-USD rate", () => {
    expect(parseRatesResponse(payload({ EUR: 0 }))).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(parseRatesResponse(null)).toBeNull();
    expect(parseRatesResponse("rates")).toBeNull();
  });
});
