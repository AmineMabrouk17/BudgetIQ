import { describe, expect, it, vi } from "vitest";
import { computeBudgetTargets } from "@/lib/salary-planner";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("computeBudgetTargets", () => {
  it("allocates 60% essentials / 20% lifestyle for a salary without dependents", () => {
    const targets = computeBudgetTargets(5000, false);

    expect(targets.salary).toBe(5000);
    expect(targets.hasDependents).toBe(false);
    expect(targets.maxEssentials).toBe(3000);
    expect(targets.maxLifestyle).toBe(1000);
    expect(targets.targetInvestmentMin).toBe(500);
    expect(targets.targetInvestmentIdeal).toBe(1000);
  });

  it("targets 6 months of essentials for the emergency fund without dependents", () => {
    const targets = computeBudgetTargets(5000, false);

    expect(targets.targetEmergencyFundMin).toBe(3000 * 3);
    expect(targets.targetEmergencyFundMax).toBe(3000 * 6);
  });

  it("extends the emergency fund target to 12 months for dependents", () => {
    const targets = computeBudgetTargets(5000, true);

    expect(targets.hasDependents).toBe(true);
    expect(targets.targetEmergencyFundMax).toBe(3000 * 12);
  });

  it("clamps negative salaries to zero and still computes valid targets", () => {
    const targets = computeBudgetTargets(-100, false);

    expect(targets.salary).toBe(0);
    expect(targets.maxEssentials).toBe(0);
    expect(targets.maxLifestyle).toBe(0);
    expect(targets.targetEmergencyFundMin).toBe(0);
    expect(targets.targetEmergencyFundMax).toBe(0);
    expect(targets.targetInvestmentMin).toBe(0);
    expect(targets.targetInvestmentIdeal).toBe(0);
  });
});