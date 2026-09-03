import { describe, expect, it, vi } from "vitest";
import { needsOnboarding } from "@/lib/profiles";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("needsOnboarding", () => {
  it("returns true for a missing profile", () => {
    expect(needsOnboarding(null)).toBe(true);
  });

  it("returns true when income_type has not been set", () => {
    expect(needsOnboarding({ income_type: null })).toBe(true);
  });

  it("returns false once an income type has been chosen", () => {
    expect(needsOnboarding({ income_type: "salaried" })).toBe(false);
    expect(needsOnboarding({ income_type: "freelancer" })).toBe(false);
  });
});