import { describe, expect, it } from "vitest";
import { parseAdvisorEnvelope, parseEnvelope } from "@/lib/gemini";

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

describe("parseAdvisorEnvelope", () => {
  const BREAKDOWN = JSON.stringify({
    message: "Rent is high but you are saving.",
    adviceSummary: "Trim lifestyle by 40.",
    monthlySalary: 1700,
    replaceActuals: true,
    lineItems: [
      { label: "House rent", amount: 450, bucket: "essentials" },
      { label: "Internet subscription", amount: 110, bucket: "essentials" },
      { label: "Daily expenses", amount: 450, bucket: "essentials" },
      { label: "Sport membership", amount: 60, bucket: "lifestyle" },
      { label: "Investment", amount: 200, bucket: "investments" },
    ],
  });

  it("keeps a stated salary and every extracted line item", () => {
    const result = parseAdvisorEnvelope(BREAKDOWN);

    expect(result.monthlySalary).toBe(1700);
    expect(result.replaceActuals).toBe(true);
    expect(result.lineItems).toHaveLength(5);
    expect(result.lineItems?.[0]).toEqual({
      label: "House rent",
      amount: 450,
      bucket: "essentials",
    });
  });

  it("accepts numeric strings for amounts", () => {
    const result = parseAdvisorEnvelope(
      JSON.stringify({
        message: "ok",
        lineItems: [{ label: "Rent", amount: "450", bucket: "essentials" }],
      })
    );

    expect(result.lineItems?.[0]?.amount).toBe(450);
  });

  it("omits absent optional fields instead of emitting undefined", () => {
    const result = parseAdvisorEnvelope(
      JSON.stringify({ message: "How can I save more?" })
    );

    expect(result).toEqual({ message: "How can I save more?" });
    expect("lineItems" in result).toBe(false);
    expect("monthlySalary" in result).toBe(false);
  });

  it("drops a whole invalid line item rather than trusting its amount", () => {
    const result = parseAdvisorEnvelope(
      JSON.stringify({
        message: "ok",
        lineItems: [
          { label: "Rent", amount: 450, bucket: "essentials" },
          { label: "Ghost", amount: -900, bucket: "essentials" },
        ],
      })
    );

    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems?.[0]?.amount).toBe(450);
  });

  it("drops items with an unknown bucket", () => {
    const result = parseAdvisorEnvelope(
      JSON.stringify({
        message: "ok",
        lineItems: [
          { label: "Rent", amount: 450, bucket: "essentials" },
          { label: "Salary", amount: 1700, bucket: "income" },
        ],
      })
    );

    expect(result.lineItems).toEqual([
      { label: "Rent", amount: 450, bucket: "essentials" },
    ]);
  });

  it("drops a non-numeric salary rather than storing it", () => {
    const result = parseAdvisorEnvelope(
      JSON.stringify({ message: "ok", monthlySalary: "a lot" })
    );

    expect("monthlySalary" in result).toBe(false);
  });

  it("keeps the message when the rest of the envelope is malformed", () => {
    const result = parseAdvisorEnvelope(
      JSON.stringify({ message: "Spend less on dining.", adviceSummary: 42 })
    );

    expect(result.message).toBe("Spend less on dining.");
  });

  it("treats non-JSON output as plain text instead of throwing", () => {
    const result = parseAdvisorEnvelope("Your budget looks reasonable.");

    expect(result).toEqual({ message: "Your budget looks reasonable." });
  });

  it("never returns an empty message", () => {
    const result = parseAdvisorEnvelope("   ");

    expect(result.message.length).toBeGreaterThan(0);
  });
});
