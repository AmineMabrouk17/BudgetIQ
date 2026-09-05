import { describe, expect, it } from "vitest";
import {
  canonicalizeCategory,
  titleCase,
  filterCategories,
  suggestCategory,
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

describe("suggestCategory", () => {
  const cases: { keyword: string; expected: string }[] = [
    { keyword: "uber", expected: "Transportation" },
    { keyword: "lyft", expected: "Transportation" },
    { keyword: "gas", expected: "Transportation" },
    { keyword: "netflix", expected: "Subscriptions" },
    { keyword: "spotify", expected: "Subscriptions" },
    { keyword: "rent", expected: "Housing & Rent" },
    { keyword: "electric bill", expected: "Utilities & Bills" },
    { keyword: "wifi", expected: "Utilities & Bills" },
    { keyword: "groceries", expected: "Groceries" },
    { keyword: "walmart", expected: "Groceries" },
    { keyword: "restaurant", expected: "Food & Dining" },
    { keyword: "starbucks", expected: "Food & Dining" },
    { keyword: "movie", expected: "Entertainment & Leisure" },
    { keyword: "pharmacy", expected: "Health & Medical" },
    { keyword: "gym", expected: "Health & Medical" },
    { keyword: "salary", expected: "Work & Business" },
    { keyword: "invoice", expected: "Work & Business" },
    { keyword: "amazon", expected: "Shopping & Other" },
  ];

  for (const { keyword, expected } of cases) {
    it(`suggests "${expected}" for "${keyword}"`, () => {
      expect(suggestCategory(keyword)).toBe(expected);
    });
  }

  it("matches keywords substring-aware within a longer title", () => {
    expect(suggestCategory("Uber ride to airport")).toBe("Transportation");
    expect(suggestCategory("Netflix monthly subscription")).toBe(
      "Subscriptions"
    );
  });

  it("is case-insensitive", () => {
    expect(suggestCategory("UBER")).toBe("Transportation");
    expect(suggestCategory("NetFlix")).toBe("Subscriptions");
    expect(suggestCategory("WALMART")).toBe("Groceries");
  });

  it("returns null when no keyword matches", () => {
    expect(suggestCategory("one-off gift from grandma")).toBeNull();
    expect(suggestCategory("")).toBeNull();
    expect(suggestCategory("   ")).toBeNull();
  });

  it("returns a preset label exactly as defined in CATEGORY_PRESETS", () => {
    const presetLabels = CATEGORY_PRESETS.map((p) => p.label);
    for (const { keyword } of cases) {
      expect(presetLabels).toContain(suggestCategory(keyword));
    }
  });
});
