import { describe, expect, it } from "vitest";
import { canonicalizeCategory } from "@/lib/categories";

describe("canonicalizeCategory", () => {
  it("title-cases an uppercase category", () => {
    expect(canonicalizeCategory("FOOD")).toBe("Food");
  });

  it("title-cases a lowercase category", () => {
    expect(canonicalizeCategory("food")).toBe("Food");
  });

  it("trims surrounding whitespace", () => {
    expect(canonicalizeCategory("  food  ")).toBe("Food");
  });

  it("handles mixed case", () => {
    expect(canonicalizeCategory("fOoD")).toBe("Food");
  });

  it("title-cases every word in a multi-word category", () => {
    expect(canonicalizeCategory("food and drink")).toBe("Food And Drink");
  });

  it("defaults empty strings to General", () => {
    expect(canonicalizeCategory("")).toBe("General");
    expect(canonicalizeCategory("   ")).toBe("General");
  });

  it("defaults null and undefined to General", () => {
    expect(canonicalizeCategory(null)).toBe("General");
    expect(canonicalizeCategory(undefined)).toBe("General");
  });
});
