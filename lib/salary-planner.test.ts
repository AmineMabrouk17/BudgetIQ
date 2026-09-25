import { describe, expect, it } from "vitest";
import {
  computeBudgetTargets,
  isAdvisorBucket,
  mergeBucketActuals,
  sanitizeSalary,
  sumLineItemsByBucket,
} from "@/lib/salary-planner";
import type { AdvisorLineItem, BucketActuals } from "@/types/salary-planner";

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

const EMPTY: BucketActuals = {
  essentials: 0,
  lifestyle: 0,
  emergencyFund: 0,
  investments: 0,
};

function item(
  label: string,
  amount: number,
  bucket: AdvisorLineItem["bucket"]
): AdvisorLineItem {
  return { label, amount, bucket };
}

describe("sumLineItemsByBucket", () => {
  it("sums a mixed breakdown into the four KPI buckets", () => {
    // "salary 1700, rent 450, gym 60, internet 110, investment 200, daily 450"
    const totals = sumLineItemsByBucket([
      item("House rent", 450, "essentials"),
      item("Internet subscription", 110, "essentials"),
      item("Daily expenses", 450, "essentials"),
      item("Sport membership", 60, "lifestyle"),
      item("Investment", 200, "investments"),
    ]);

    expect(totals).toEqual({
      essentials: 1010,
      lifestyle: 60,
      emergencyFund: 0,
      investments: 200,
    });
  });

  it("adds several items in the same bucket instead of overwriting", () => {
    const totals = sumLineItemsByBucket([
      item("Rent", 450, "essentials"),
      item("Water", 30, "essentials"),
      item("Electricity", 20, "essentials"),
    ]);

    expect(totals.essentials).toBe(500);
  });

  it("ignores zero, negative and non-finite amounts", () => {
    const totals = sumLineItemsByBucket([
      item("Rent", 450, "essentials"),
      item("Refund", -50, "essentials"),
      item("Zero", 0, "lifestyle"),
      item("Broken", Number.NaN, "investments"),
      item("Infinite", Number.POSITIVE_INFINITY, "emergencyFund"),
    ]);

    expect(totals).toEqual({ ...EMPTY, essentials: 450 });
  });

  it("returns zeroed buckets for no line items", () => {
    expect(sumLineItemsByBucket(undefined)).toEqual(EMPTY);
    expect(sumLineItemsByBucket([])).toEqual(EMPTY);
  });

  it("rounds to two decimals to match the NUMERIC(12,2) column", () => {
    const totals = sumLineItemsByBucket([
      item("Rent", 450.005, "essentials"),
      item("Coffee", 0.005, "lifestyle"),
    ]);

    expect(totals.essentials).toBe(450.01);
    expect(totals.lifestyle).toBe(0.01);
  });
});

describe("mergeBucketActuals", () => {
  it("replaces stored totals when the user gives a full breakdown", () => {
    const current: BucketActuals = {
      essentials: 900,
      lifestyle: 300,
      emergencyFund: 0,
      investments: 0,
    };

    const merged = mergeBucketActuals(
      current,
      [item("House rent", 450, "essentials"), item("Gym", 60, "lifestyle")],
      true
    );

    expect(merged).toEqual({
      essentials: 450,
      lifestyle: 60,
      emergencyFund: 0,
      investments: 0,
    });
  });

  it("adds to stored totals when the user only adds one item", () => {
    const current: BucketActuals = {
      essentials: 900,
      lifestyle: 300,
      emergencyFund: 0,
      investments: 0,
    };

    const merged = mergeBucketActuals(
      current,
      [item("Coffee", 50, "lifestyle")],
      false
    );

    expect(merged).toEqual({
      essentials: 900,
      lifestyle: 350,
      emergencyFund: 0,
      investments: 0,
    });
  });

  it("leaves totals untouched when nothing was extracted", () => {
    const current: BucketActuals = {
      essentials: 900,
      lifestyle: 300,
      emergencyFund: 100,
      investments: 200,
    };

    expect(mergeBucketActuals(current, undefined, false)).toEqual(current);
  });
});

describe("sanitizeSalary", () => {
  it("keeps a stated salary", () => {
    expect(sanitizeSalary(1700, 0)).toBe(1700);
  });

  it("falls back to the current salary when none was stated", () => {
    expect(sanitizeSalary(undefined, 1200)).toBe(1200);
  });

  it("treats a zero salary as unstated rather than erasing the stored one", () => {
    expect(sanitizeSalary(0, 1200)).toBe(1200);
  });

  it("falls back rather than storing a negative or non-finite salary", () => {
    expect(sanitizeSalary(-1, 1200)).toBe(1200);
    expect(sanitizeSalary(Number.NaN, 1200)).toBe(1200);
    expect(sanitizeSalary(Number.POSITIVE_INFINITY, 1200)).toBe(1200);
  });

  it("rounds to two decimals", () => {
    expect(sanitizeSalary(1700.129, 0)).toBe(1700.13);
  });
});

describe("isAdvisorBucket", () => {
  it("accepts the four bucket names", () => {
    expect(isAdvisorBucket("essentials")).toBe(true);
    expect(isAdvisorBucket("lifestyle")).toBe(true);
    expect(isAdvisorBucket("emergencyFund")).toBe(true);
    expect(isAdvisorBucket("investments")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isAdvisorBucket("Essentials")).toBe(false);
    expect(isAdvisorBucket("income")).toBe(false);
    expect(isAdvisorBucket(undefined)).toBe(false);
  });
});