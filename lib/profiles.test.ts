import { describe, expect, it, vi } from "vitest";
import {
  isOnboardedFromSession,
  needsOnboarding,
  updateIncomeProfileInDb,
} from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

const PROFILE = {
  id: "user-1",
  email: "a@b.c",
  full_name: null,
  avatar_url: null,
  income_type: "salaried",
  payday: 28,
  expected_income: 5000,
} as const;

function mockUpdate(assertPayload: (payload: Record<string, unknown>) => void) {
  const update = vi.fn(
    (payload: Record<string, unknown>) => {
      assertPayload(payload);
      return {
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: PROFILE,
              error: null,
            }),
          }),
        }),
      };
    }
  );
  mockedCreateClient.mockResolvedValue({
    from: vi.fn().mockReturnValue({ update }),
  } as never);
  return update;
}

describe("isOnboardedFromSession", () => {
  it("returns false without a user", () => {
    expect(isOnboardedFromSession(null)).toBe(false);
  });

  it("returns false when the flag has not been set", () => {
    expect(isOnboardedFromSession({ user_metadata: {} })).toBe(false);
  });

  it("only trusts a strict boolean true", () => {
    // The value is attacker-reachable if the signature is ever skipped, so a
    // truthy-but-not-true value must not count as onboarded.
    expect(isOnboardedFromSession({ user_metadata: { onboarded: "yes" } })).toBe(
      false
    );
    expect(isOnboardedFromSession({ user_metadata: { onboarded: 1 } })).toBe(
      false
    );
  });

  it("returns true once the token carries the flag", () => {
    expect(
      isOnboardedFromSession({ user_metadata: { onboarded: true } })
    ).toBe(true);
  });
});

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

describe("updateIncomeProfileInDb", () => {
  it("omits payday/expected_income from the update when not provided", async () => {
    const update = mockUpdate((payload) => {
      expect(payload).toEqual({ income_type: "salaried" });
    });

    await updateIncomeProfileInDb("user-1", { income_type: "salaried" });

    expect(update).toHaveBeenCalled();
  });

  it("writes payday/expected_income when provided", async () => {
    const update = mockUpdate((payload) => {
      expect(payload).toEqual({
        income_type: "hourly",
        payday: 15,
        expected_income: 3200.5,
      });
    });

    await updateIncomeProfileInDb("user-1", {
      income_type: "hourly",
      payday: 15,
      expected_income: 3200.5,
    });

    expect(update).toHaveBeenCalled();
  });

  it("clears payday/expected_income only when explicitly null", async () => {
    const update = mockUpdate((payload) => {
      expect(payload).toEqual({
        income_type: "salaried",
        payday: null,
        expected_income: null,
      });
    });

    await updateIncomeProfileInDb("user-1", {
      income_type: "salaried",
      payday: null,
      expected_income: null,
    });

    expect(update).toHaveBeenCalled();
  });
});