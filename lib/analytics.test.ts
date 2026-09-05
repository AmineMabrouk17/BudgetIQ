import { describe, expect, it } from "vitest";
import { getCashFlow, getTrajectory } from "@/lib/analytics";
import type { Transaction, TransactionScope } from "@/types/transaction";

const NOW = new Date(2026, 2, 15);

function at(year: number, month: number, day: number): string {
  return new Date(year, month, day, 12).toISOString();
}

function transaction(
  type: Transaction["type"],
  amount: number,
  created_at: string,
  scope: TransactionScope = "personal"
): Transaction {
  return {
    id: `${type}-${amount}-${created_at}-${scope}`,
    user_id: "user-1",
    type,
    title: "Test transaction",
    amount,
    category: "General",
    created_at,
    scope,
  };
}

describe("getCashFlow", () => {
  it("returns six zero-filled months for empty input", () => {
    const result = getCashFlow([], "all", NOW);

    expect(result).toHaveLength(6);
    for (const month of result) {
      expect(month.income).toBe(0);
      expect(month.expense).toBe(0);
      expect(month.net).toBe(0);
    }
    expect(result[5].month).toBe("Mar 2026");
    expect(result[0].month).toBe("Oct 2025");
  });

  it("groups income and expense by month over the trailing six months", () => {
    const result = getCashFlow(
      [
        transaction("income", 5000, at(2026, 2, 5)),
        transaction("expense", 1200, at(2026, 2, 10)),
        transaction("income", 4000, at(2026, 1, 10)),
        transaction("expense", 3000, at(2026, 1, 12)),
        transaction("income", 2000, at(2025, 11, 3)),
        transaction("expense", 500, at(2025, 9, 1)),
      ],
      "all",
      NOW
    );

    const mar = result[5];
    expect(mar.month).toBe("Mar 2026");
    expect(mar.income).toBe(5000);
    expect(mar.expense).toBe(1200);
    expect(mar.net).toBe(3800);

    const feb = result[4];
    expect(feb.month).toBe("Feb 2026");
    expect(feb.income).toBe(4000);
    expect(feb.expense).toBe(3000);
    expect(feb.net).toBe(1000);
  });

  it("zero-fills months with no data while keeping the six-month span", () => {
    const result = getCashFlow(
      [transaction("income", 5000, at(2026, 2, 5))],
      "all",
      NOW
    );

    expect(result).toHaveLength(6);
    expect(result[5].month).toBe("Mar 2026");
    expect(result[5].income).toBe(5000);
    expect(result[4].month).toBe("Feb 2026");
    expect(result[4].income).toBe(0);

    const jan = result[3];
    expect(jan.month).toBe("Jan 2026");
    expect(jan.income).toBe(0);
    expect(jan.expense).toBe(0);
    expect(jan.net).toBe(0);
  });

  it("ignores asset transactions and out-of-window months", () => {
    const result = getCashFlow(
      [
        transaction("asset", 10000, at(2026, 2, 6)),
        transaction("income", 9999, at(2024, 5, 6)),
        transaction("expense", 100, at(2026, 2, 7)),
      ],
      "all",
      NOW
    );

    expect(result[5].month).toBe("Mar 2026");
    expect(result[5].income).toBe(0);
    expect(result[5].expense).toBe(100);
    expect(result).toHaveLength(6);
    expect(result[0].month).toBe("Oct 2025");
  });

  it("respects scope: business-only filters out personal transactions", () => {
    const result = getCashFlow(
      [
        transaction("income", 9000, at(2026, 2, 5), "business"),
        transaction("expense", 1000, at(2026, 2, 6), "business"),
        transaction("income", 5000, at(2026, 2, 3), "personal"),
        transaction("expense", 2000, at(2026, 2, 4), "personal"),
      ],
      "business",
      NOW
    );

    const mar = result[5];
    expect(mar.income).toBe(9000);
    expect(mar.expense).toBe(1000);
    expect(mar.net).toBe(8000);
  });

  it("defaults scope to all", () => {
    const result = getCashFlow(
      [
        transaction("income", 9000, at(2026, 2, 5), "business"),
        transaction("income", 5000, at(2026, 2, 3), "personal"),
      ],
      undefined,
      NOW
    );

    expect(result[5].income).toBe(14000);
  });

  it("excludes future transactions relative to now", () => {
    const result = getCashFlow(
      [transaction("income", 5000, at(2026, 3, 2))],
      "all",
      NOW
    );

    expect(result[5].month).toBe("Mar 2026");
    expect(result[5].income).toBe(0);
  });
});

describe("getTrajectory", () => {
  it("returns points for each day of the current month", () => {
    const now = new Date(2026, 1, 28);
    const result = getTrajectory([], "all", now);

    expect(result).toHaveLength(28);
    expect(result[0].day).toBe(1);
    expect(result[27].day).toBe(28);
    for (const point of result) {
      expect(point.currentMonthSpent).toBe(0);
      expect(point.lastMonthSpent).toBe(0);
    }
  });

  it("returns a zero-filled trajectory for empty input", () => {
    const result = getTrajectory([], "all", NOW);

    expect(result).toHaveLength(31);
    for (const point of result) {
      expect(point.currentMonthSpent).toBe(0);
      expect(point.lastMonthSpent).toBe(0);
    }
  });

  it("accumulates current-month spend up to today", () => {
    const result = getTrajectory(
      [
        transaction("expense", 100, at(2026, 2, 3)),
        transaction("expense", 50, at(2026, 2, 8)),
        transaction("expense", 25, at(2026, 2, 3)),
      ],
      "all",
      NOW
    );

    const day3 = result[2];
    expect(day3.currentMonthSpent).toBe(125);

    const day8 = result[7];
    expect(day8.currentMonthSpent).toBe(175);

    const day15 = result[14];
    expect(day15.currentMonthSpent).toBe(175);
  });

  it("accumulates prior-month spend aligned onto the same day axis", () => {
    const result = getTrajectory(
      [
        transaction("expense", 100, at(2026, 1, 3)),
        transaction("expense", 50, at(2026, 1, 8)),
        transaction("expense", 200, at(2026, 0, 5)),
      ],
      "all",
      NOW
    );

    const day3 = result[2];
    expect(day3.lastMonthSpent).toBe(100);

    const day8 = result[7];
    expect(day8.lastMonthSpent).toBe(150);

    const day15 = result[14];
    expect(day15.lastMonthSpent).toBe(150);

    const jan3 = result[2];
    expect(jan3.currentMonthSpent).toBe(0);
  });

  it("accumulates prior-month spend across the full day axis (prior month is complete)", () => {
    const result = getTrajectory(
      [transaction("expense", 100, at(2026, 1, 10))],
      "all",
      NOW
    );

    expect(result[9].lastMonthSpent).toBe(100);
    expect(result[10].lastMonthSpent).toBe(100);
    expect(result[30].lastMonthSpent).toBe(100);
  });

  it("truncates prior-month spending that falls beyond the current month length", () => {
    const now = new Date(2026, 1, 5);
    const result = getTrajectory(
      [transaction("expense", 999, at(2026, 0, 31))],
      "all",
      now
    );

    expect(result).toHaveLength(28);
    for (const point of result) {
      expect(point.lastMonthSpent).toBe(0);
    }
  });

  it("respects scope: business-only filters out personal spending", () => {
    const result = getTrajectory(
      [
        transaction("expense", 1000, at(2026, 2, 5), "business"),
        transaction("expense", 500, at(2026, 2, 6), "personal"),
      ],
      "business",
      NOW
    );

    expect(result[4].currentMonthSpent).toBe(1000);
    expect(result[5].currentMonthSpent).toBe(1000);
  });

  it("only counts expense transactions", () => {
    const result = getTrajectory(
      [
        transaction("income", 5000, at(2026, 2, 5)),
        transaction("asset", 1000, at(2026, 2, 6)),
        transaction("expense", 200, at(2026, 2, 7)),
      ],
      "all",
      NOW
    );

    expect(result[6].currentMonthSpent).toBe(200);
  });
});
