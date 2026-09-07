import { describe, expect, it } from "vitest";
import { parseEnvelope } from "@/lib/gemini";

describe("parseEnvelope amount parsing", () => {
  function envelope(amount: unknown) {
    return JSON.stringify({
      message: "Got it",
      hasAction: true,
      transaction: {
        type: "expense",
        title: "Coffee",
        amount,
      },
    });
  }

  it("accepts a plain positive number", () => {
    const result = parseEnvelope(envelope(45));
    expect(result.transaction?.amount).toBe(45);
  });

  it("accepts a decimal number", () => {
    const result = parseEnvelope(envelope(12.5));
    expect(result.transaction?.amount).toBe(12.5);
  });

  it("accepts a numeric string", () => {
    const result = parseEnvelope(envelope("45"));
    expect(result.transaction?.amount).toBe(45);
  });

  it("rejects a number with trailing characters (was 45abc -> 45)", () => {
    expect(() => parseEnvelope(envelope("45abc"))).toThrow(
      "invalid transaction amount"
    );
  });

  it("rejects a zero amount", () => {
    expect(() => parseEnvelope(envelope(0))).toThrow("invalid transaction amount");
  });

  it("rejects a negative amount", () => {
    expect(() => parseEnvelope(envelope(-5))).toThrow("invalid transaction amount");
  });

  it("rejects a non-numeric string", () => {
    expect(() => parseEnvelope(envelope("abc"))).toThrow(
      "invalid transaction amount"
    );
  });
});

describe("parseEnvelope response shape regression", () => {
  it("has no action returns exactly { message, hasAction }", () => {
    const result = parseEnvelope(
      JSON.stringify({ message: "Hello", hasAction: false })
    );
    expect(result).toEqual({ message: "Hello", hasAction: false });
    expect(Object.keys(result).sort()).toEqual(["hasAction", "message"]);
  });

  it("with action returns exactly { message, hasAction, transaction }", () => {
    const result = parseEnvelope(
      JSON.stringify({
        message: "Logged it",
        hasAction: true,
        transaction: {
          type: "expense",
          title: "Lunch",
          amount: "12",
          category: "Food",
        },
      })
    );
    expect(result).toEqual({
      message: "Logged it",
      hasAction: true,
      transaction: {
        type: "expense",
        title: "Lunch",
        amount: 12,
        category: "Food",
      },
    });
    expect(Object.keys(result).sort()).toEqual([
      "hasAction",
      "message",
      "transaction",
    ]);
  });

  it("with action omits undefined category from transaction", () => {
    const result = parseEnvelope(
      JSON.stringify({
        message: "Logged it",
        hasAction: true,
        transaction: { type: "income", title: "Salary", amount: 500 },
      })
    );
    expect(result).toEqual({
      message: "Logged it",
      hasAction: true,
      transaction: { type: "income", title: "Salary", amount: 500 },
    });
    expect(Object.keys(result.transaction ?? {})).toEqual([
      "type",
      "title",
      "amount",
    ]);
  });
});
