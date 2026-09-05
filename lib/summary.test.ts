import { describe, expect, it } from "vitest";
import { computeSummary } from "@/lib/summary";
import type { Transaction } from "@/types/transaction";

const NOW = new Date(2026, 2, 15);

function at(year: number, month: number, day: number): string {
  return new Date(year, month, day, 12).toISOString();
}

function transaction(
  type: Transaction["type"],
  amount: number,
  created_at: string
): Transaction {
  return {
    id: `${type}-${amount}-${created_at}`,
    user_id: "user-1",
    type,
    title: "Test transaction",
    amount,
    category: "General",
    created_at,
  };
}

describe("computeSummary", () => {
  it("reports current-month income, expenses, and savings rate", () => {
    const summary = computeSummary(
      [
        transaction("income", 5000, at(2026, 2, 5)),
        transaction("expense", 1200, at(2026, 2, 10)),
        transaction("expense", 800, at(2026, 2, 20)),
        transaction("asset", 10000, at(2026, 0, 2)),
      ],
      NOW
    );

    expect(summary.monthlyIncome).toBe(5000);
    expect(summary.monthlyExpenses).toBe(2000);
    expect(summary.monthlySpending).toBe(2000);
    expect(summary.savingsRate).toBeCloseTo(0.6);
    expect(summary.netBalance).toBe(13000);
    expect(summary.totalAssets).toBe(10000);
  });

  it("returns a savings rate of 1 when the month only has income", () => {
    const summary = computeSummary(
      [transaction("income", 3000, at(2026, 2, 5))],
      NOW
    );

    expect(summary.monthlyIncome).toBe(3000);
    expect(summary.monthlyExpenses).toBe(0);
    expect(summary.savingsRate).toBe(1);
  });

  it("allows a negative savings rate when expenses exceed income", () => {
    const summary = computeSummary(
      [
        transaction("income", 1000, at(2026, 2, 5)),
        transaction("expense", 2000, at(2026, 2, 6)),
      ],
      NOW
    );

    expect(summary.savingsRate).toBeCloseTo(-1);
  });

  it("deltas compare each monthly figure against last month", () => {
    const summary = computeSummary(
      [
        transaction("income", 4000, at(2026, 1, 10)),
        transaction("expense", 3000, at(2026, 1, 12)),
        transaction("income", 5000, at(2026, 2, 3)),
        transaction("expense", 2000, at(2026, 2, 4)),
      ],
      NOW
    );

    expect(summary.deltas.income.value).toBe(1000);
    expect(summary.deltas.income.percentage).toBeCloseTo(25);
    expect(summary.deltas.expenses.value).toBe(-1000);
    expect(summary.deltas.expenses.percentage).toBeCloseTo(-100 / 3);
    expect(summary.deltas.monthlySpending.value).toBe(-1000);
    expect(summary.deltas.monthlySpending.percentage).toBeCloseTo(-100 / 3);
    expect(summary.deltas.savingsRate?.value).toBeCloseTo(0.35);
    expect(summary.deltas.savingsRate?.percentage).toBeNull();
  });

  it("counts month-boundary transactions toward the correct period", () => {
    const summary = computeSummary(
      [
        transaction("income", 1000, new Date(2026, 2, 1).toISOString()),
        transaction("income", 500, new Date(2026, 1, 1).toISOString()),
        transaction("income", 2500, at(2026, 0, 15)),
      ],
      NOW
    );

    expect(summary.monthlyIncome).toBe(1000);
    expect(summary.deltas.income.value).toBe(500);
    expect(summary.deltas.income.percentage).toBeCloseTo(100);
    expect(summary.netBalance).toBe(4000);
  });

  it("leaves the savings rate null when the month has no income", () => {
    const summary = computeSummary(
      [transaction("expense", 500, at(2026, 2, 5))],
      NOW
    );

    expect(summary.monthlyIncome).toBe(0);
    expect(summary.monthlyExpenses).toBe(500);
    expect(summary.savingsRate).toBeNull();
    expect(summary.deltas.savingsRate).toBeNull();
  });

  it("reports no savings-rate delta when either month has no income", () => {
    const summary = computeSummary(
      [
        transaction("income", 1000, at(2026, 1, 10)),
        transaction("expense", 200, at(2026, 1, 11)),
      ],
      NOW
    );

    expect(summary.monthlyIncome).toBe(0);
    expect(summary.savingsRate).toBeNull();
    expect(summary.deltas.income.value).toBe(-1000);
    expect(summary.deltas.income.percentage).toBeCloseTo(-100);
    expect(summary.deltas.savingsRate).toBeNull();
  });

  it("reports a null percentage when the previous month had no figure", () => {
    const summary = computeSummary(
      [transaction("income", 1000, at(2026, 2, 5))],
      NOW
    );

    expect(summary.deltas.income.value).toBe(1000);
    expect(summary.deltas.income.percentage).toBeNull();
  });
});

describe("computeSummary with pay cycle", () => {
  function cycleSummary(
    transactions: Transaction[],
    now: Date,
    overrides: {
      payday: number;
      expectedIncome: number;
      graceDays?: number;
      cycleTransactions?: Transaction[];
    }
  ) {
    return computeSummary(transactions, now, {
      payCycle: {
        payday: overrides.payday,
        expectedIncome: overrides.expectedIncome,
        graceDays: overrides.graceDays,
        cycleTransactions: overrides.cycleTransactions ?? transactions,
      },
    });
  }

  it("keeps KPIs stable across a calendar-month boundary for a 28th payday", () => {
    const at28 = (year: number, month: number) => at(year, month, 28);
    const now = new Date(2026, 2, 5);
    const transactions = [
      transaction("income", 5000, at28(2026, 0)),
      transaction("income", 5000, at28(2026, 1)),
      transaction("expense", 1500, at(2026, 2, 2)),
    ];

    const summary = cycleSummary(transactions, now, {
      payday: 28,
      expectedIncome: 5000,
    });

    expect(summary.payCycle?.enabled).toBe(true);
    expect(summary.monthlyIncome).toBe(5000);
    expect(summary.payCycle?.actualIncome).toBe(5000);
    expect(summary.deltas.income.value).toBe(0);
    expect(summary.deltas.income.percentage).toBeCloseTo(0);
  });

  it("reports an overdue state when payday plus grace passes with no income", () => {
    const now = new Date(2026, 2, 10);
    const transactions = [transaction("expense", 500, at(2026, 2, 2))];

    const summary = cycleSummary(transactions, now, {
      payday: 28,
      expectedIncome: 5000,
      graceDays: 5,
    });

    expect(summary.payCycle?.overdue).toBe(true);
    expect(summary.payCycle?.received).toBe(false);
    expect(summary.payCycle?.actualIncome).toBe(0);
  });

  it("does not report overdue within the grace period after payday", () => {
    const now = new Date(2026, 3, 1);
    const transactions = [transaction("expense", 500, at(2026, 3, 1))];

    const summary = cycleSummary(transactions, now, {
      payday: 28,
      expectedIncome: 5000,
      graceDays: 5,
    });

    expect(summary.payCycle?.overdue).toBe(false);
  });

  it("marks the cycle as received once expected income is logged", () => {
    const now = new Date(2026, 2, 10);
    const transactions = [transaction("income", 5000, at(2026, 1, 28))];

    const summary = cycleSummary(transactions, now, {
      payday: 28,
      expectedIncome: 5000,
    });

    expect(summary.payCycle?.received).toBe(true);
    expect(summary.payCycle?.overdue).toBe(false);
  });

  it("compares expected income against actual income for the cycle", () => {
    const now = new Date(2026, 2, 10);
    const transactions = [transaction("income", 3000, at(2026, 1, 28))];

    const summary = cycleSummary(transactions, now, {
      payday: 28,
      expectedIncome: 5000,
    });

    expect(summary.payCycle?.expectedIncome).toBe(5000);
    expect(summary.payCycle?.actualIncome).toBe(3000);
    expect(summary.payCycle?.received).toBe(false);
  });

  it("falls back to calendar-month behavior when no pay cycle is configured", () => {
    const summary = computeSummary(
      [transaction("income", 5000, at(2026, 1, 28))],
      NOW
    );

    expect(summary.payCycle).toBeNull();
    expect(summary.monthlyIncome).toBe(0);
    expect(summary.deltas.income.value).toBe(-5000);
  });
});
