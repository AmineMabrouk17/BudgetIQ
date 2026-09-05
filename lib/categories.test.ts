import { describe, expect, it } from "vitest";
import {
  canonicalizeCategory,
  titleCase,
  filterCategories,
  CATEGORY_PRESETS,
} from "@/lib/categories";

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

describe("titleCase", () => {
  it("title-cases a lowercase string", () => {
    expect(titleCase("food")).toBe("Food");
  });

  it("title-cases a multi-word string", () => {
    expect(titleCase("my custom category")).toBe("My Custom Category");
  });

  it("returns General for empty string", () => {
    expect(titleCase("")).toBe("General");
  });
});

describe("filterCategories", () => {
  const history = ["Freelance Income", "Gym Membership"];

  it("returns all presets + history when query is empty", () => {
    const result = filterCategories("", history);
    const presetLabels = CATEGORY_PRESETS.map((p) => p.label);
    expect(result).toContain("Freelance Income");
    expect(result).toContain("Gym Membership");
    for (const preset of presetLabels) {
      expect(result).toContain(preset);
    }
  });

  it("filters by query text (case-insensitive)", () => {
    const result = filterCategories("food", history);
    expect(result).toContain("Food & Dining");
    expect(result).not.toContain("Housing & Rent");
  });

  it("filters history entries", () => {
    const result = filterCategories("freelance", history);
    expect(result).toContain("Freelance Income");
    expect(result).not.toContain("Food & Dining");
  });

  it("deduplicates entries that appear in both presets and history", () => {
    const result = filterCategories("", ["Food & Dining"]);
    const foodCount = result.filter((c) => c === "Food & Dining").length;
    expect(foodCount).toBe(1);
  });

  it("returns empty array when nothing matches", () => {
    const result = filterCategories("zzzzz", history);
    expect(result).toHaveLength(0);
  });
});
