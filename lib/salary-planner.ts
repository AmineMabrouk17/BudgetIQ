import {
  ADVISOR_BUCKETS,
  type BudgetTargets,
  type AdvisorBucket,
  type AdvisorLineItem,
  type BucketActuals,
} from "@/types/salary-planner";

export function computeBudgetTargets(salary: number, hasDependents: boolean): BudgetTargets {
  const safeSalary = Math.max(0, salary);
  const maxEssentials = safeSalary * 0.6;
  const maxLifestyle = safeSalary * 0.2;

  // Emergency fund target based on essentials (3-6 months, or 12 months for breadwinners)
  const targetEmergencyFundMin = maxEssentials * 3;
  const targetEmergencyFundMax = hasDependents ? maxEssentials * 12 : maxEssentials * 6;

  const targetInvestmentMin = safeSalary * 0.1;
  const targetInvestmentIdeal = safeSalary * 0.2;

  return {
    salary: safeSalary,
    hasDependents,
    maxEssentials,
    maxLifestyle,
    targetEmergencyFundMin,
    targetEmergencyFundMax,
    targetInvestmentMin,
    targetInvestmentIdeal,
  };
}

/**
 * Turns the advisor's free-text breakdown ("rent 450, internet 110, gym 60")
 * into the four KPI totals. Every line item is counted exactly once, so a
 * bucket total is always the sum of the items the user actually named —
 * never a number the model made up.
 */
export function sumLineItemsByBucket(
  lineItems: AdvisorLineItem[] | undefined
): BucketActuals {
  const totals = Object.fromEntries(
    ADVISOR_BUCKETS.map((bucket) => [bucket, 0])
  ) as BucketActuals;

  for (const item of lineItems ?? []) {
    if (!Number.isFinite(item.amount) || item.amount <= 0) continue;
    totals[item.bucket] = round2(totals[item.bucket] + item.amount);
  }

  return totals;
}

/**
 * A full breakdown ("here's everything I pay") replaces the stored totals;
 * an incremental remark ("plus 50 for coffee") adds to them.
 */
export function mergeBucketActuals(
  current: BucketActuals,
  lineItems: AdvisorLineItem[] | undefined,
  replace: boolean
): BucketActuals {
  const extracted = sumLineItemsByBucket(lineItems);
  if (!replace) {
    return {
      essentials: round2(current.essentials + extracted.essentials),
      lifestyle: round2(current.lifestyle + extracted.lifestyle),
      emergencyFund: round2(current.emergencyFund + extracted.emergencyFund),
      investments: round2(current.investments + extracted.investments),
    };
  }
  return extracted;
}

/**
 * A salary the model reports as 0 means "the user stated no income", not
 * "erase the salary on file" — so 0 falls back to the current figure.
 */
export function sanitizeSalary(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return round2(value);
}

export function isAdvisorBucket(value: unknown): value is AdvisorBucket {
  return (
    typeof value === "string" &&
    (ADVISOR_BUCKETS as readonly string[]).includes(value)
  );
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}