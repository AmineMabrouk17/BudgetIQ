import { describe, expect, it } from "vitest";
import { evaluateKPI, evaluateKPIs } from "@/lib/kpi-calculator";
import type { CustomKPI } from "@/types/kpi";
import type { Transaction } from "@/types/transaction";

const NOW = new Date(2026, 2, 15, 12, 0, 0);

function at(year: number, month: number, day: number): string {
  return new Date(year, month, day, 12).toISOString();
}

function tx(
  type: Transaction["type"],
  amount: number,
  created_at: string,
  scope: Transaction["scope"] = "personal",
  category = "General"
): Transaction {
  return {
    id: `${type}-${amount}-${created_at}`,
    user_id: "user-1",
    type,
    title: "Test",
    amount,
    category,
    created_at,
    scope,
  };
}

function kpi(overrides: Partial<CustomKPI> = {}): CustomKPI {
  return {
    id: "kpi-1",
    user_id: "user-1",
    title: "Test KPI",
    source_type: "expense",
    category_filter: null,
    scope: "all",
    timeframe: "this_month",
    operation: "sum",
    operand: 1,
    sort_order: 0,
    created_at: at(2026, 0, 1),
    ...overrides,
  };
}

describe("evaluateKPI", () => {
  describe("scope filtering", () => {
    it("includes all transactions when scope is 'all'", () => {
      const k = kpi({ source_type: "income", scope: "all" });
      const transactions = [
        tx("income", 1000, at(2026, 2, 5), "personal"),
        tx("income", 2000, at(2026, 2, 6), "business"),
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(3000);
    });

    it("filters to personal scope only", () => {
      const k = kpi({ source_type: "income", scope: "personal" });
      const transactions = [
        tx("income", 1000, at(2026, 2, 5), "personal"),
        tx("income", 2000, at(2026, 2, 6), "business"),
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(1000);
    });

    it("filters to business scope only", () => {
      const k = kpi({ source_type: "income", scope: "business" });
      const transactions = [
        tx("income", 1000, at(2026, 2, 5), "personal"),
        tx("income", 2000, at(2026, 2, 6), "business"),
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(2000);
    });
  });

  describe("timeframe filtering", () => {
    it("this_month uses calendar month boundaries", () => {
      const k = kpi({ source_type: "income", timeframe: "this_month" });
      const transactions = [
        tx("income", 1000, at(2026, 1, 28)), // Feb 28 - before March
        tx("income", 2000, at(2026, 2, 1)),  // Mar 1 - in this month
        tx("income", 3000, at(2026, 2, 15)), // Mar 15 - in this month
        tx("income", 4000, at(2026, 3, 1)),  // Apr 1 - after this month
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(5000);
    });

    it("last_month uses previous calendar month boundaries", () => {
      const k = kpi({ source_type: "income", timeframe: "last_month" });
      const transactions = [
        tx("income", 1000, at(2026, 0, 15)), // Jan 15 - before Feb
        tx("income", 2000, at(2026, 1, 1)),  // Feb 1 - last month start
        tx("income", 3000, at(2026, 1, 28)), // Feb 28 - last month end
        tx("income", 4000, at(2026, 2, 1)),  // Mar 1 - this month
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(5000);
    });

    it("last_30_days uses rolling 30-day window", () => {
      const k = kpi({ source_type: "income", timeframe: "last_30_days" });
      const transactions = [
        tx("income", 1000, at(2026, 0, 14)), // Jan 14 - > 30 days ago
        tx("income", 2000, at(2026, 2, 1)),  // Mar 1 - within 30 days
        tx("income", 3000, at(2026, 2, 15)), // Mar 15 - within 30 days
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(5000);
    });

    it("year_to_date uses Jan 1 to now", () => {
      const k = kpi({ source_type: "income", timeframe: "year_to_date" });
      const transactions = [
        tx("income", 1000, at(2025, 11, 15)), // Dec 15, 2025 - before YTD
        tx("income", 2000, at(2026, 0, 1)),    // Jan 1 - YTD start
        tx("income", 3000, at(2026, 2, 15)),   // Mar 15 - now
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(5000);
    });

    it("all_time includes all transactions", () => {
      const k = kpi({ source_type: "income", timeframe: "all_time" });
      const transactions = [
        tx("income", 1000, at(2020, 0, 1)),
        tx("income", 2000, at(2025, 5, 15)),
        tx("income", 3000, at(2026, 2, 15)),
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(6000);
    });
  });

  describe("source types", () => {
    it("income sums income transactions", () => {
      const k = kpi({ source_type: "income" });
      const transactions = [
        tx("income", 5000, at(2026, 2, 5)),
        tx("expense", 1000, at(2026, 2, 6)),
        tx("asset", 2000, at(2026, 2, 7)),
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(5000);
    });

    it("expense sums expense transactions", () => {
      const k = kpi({ source_type: "expense" });
      const transactions = [
        tx("income", 5000, at(2026, 2, 5)),
        tx("expense", 1000, at(2026, 2, 6)),
        tx("expense", 2000, at(2026, 2, 7)),
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(3000);
    });

    it("category filters expense by category (case-insensitive)", () => {
      const k = kpi({ source_type: "category", category_filter: "Food" });
      const transactions = [
        tx("expense", 100, at(2026, 2, 5), "personal", "Food"),
        tx("expense", 200, at(2026, 2, 6), "personal", "food"),
        tx("expense", 300, at(2026, 2, 7), "personal", "Transport"),
        tx("income", 400, at(2026, 2, 8), "personal", "Food"),
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(300);
    });

    it("category returns 0 when category_filter is empty", () => {
      const k = kpi({ source_type: "category", category_filter: "" });
      const transactions = [
        tx("expense", 100, at(2026, 2, 5), "personal", "Food"),
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(0);
    });

    it("category returns 0 when category_filter is null", () => {
      const k = kpi({ source_type: "category", category_filter: null });
      const transactions = [
        tx("expense", 100, at(2026, 2, 5), "personal", "Food"),
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(0);
    });

    it("balance computes income + asset - expense", () => {
      const k = kpi({ source_type: "balance" });
      const transactions = [
        tx("income", 5000, at(2026, 2, 5)),
        tx("asset", 10000, at(2026, 2, 6)),
        tx("expense", 3000, at(2026, 2, 7)),
      ];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(12000);
    });
  });

  describe("operations", () => {
    it("sum returns base amount", () => {
      const k = kpi({ source_type: "expense", operation: "sum" });
      const transactions = [tx("expense", 500, at(2026, 2, 5))];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(500);
      expect(result.subtitle).toBe("");
    });

    it("percentage returns base * operand with subtitle", () => {
      const k = kpi({
        source_type: "expense",
        operation: "percentage",
        operand: 0.15,
      });
      const transactions = [tx("expense", 1000, at(2026, 2, 5))];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(150);
      expect(result.subtitle).toBe("15% of expense");
    });

    it("percentage with zero base shows 'source' in subtitle", () => {
      const k = kpi({
        source_type: "expense",
        operation: "percentage",
        operand: 0.15,
      });
      const result = evaluateKPI(k, [], NOW);
      expect(result.value).toBe(0);
      expect(result.subtitle).toBe("15% of source");
    });

    it("budget_remaining returns operand - base with subtitle", () => {
      const k = kpi({
        source_type: "expense",
        operation: "budget_remaining",
        operand: 600,
      });
      const transactions = [tx("expense", 200, at(2026, 2, 5))];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(400);
      expect(result.subtitle).toBe("Remaining of 600 limit");
    });

    it("budget_remaining returns negative when over budget", () => {
      const k = kpi({
        source_type: "expense",
        operation: "budget_remaining",
        operand: 300,
      });
      const transactions = [tx("expense", 500, at(2026, 2, 5))];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(-200);
      expect(result.subtitle).toBe("Remaining of 300 limit");
    });

    it("budget_remaining returns operand when no expenses", () => {
      const k = kpi({
        source_type: "expense",
        operation: "budget_remaining",
        operand: 600,
      });
      const result = evaluateKPI(k, [], NOW);
      expect(result.value).toBe(600);
      expect(result.subtitle).toBe("Remaining of 600 limit");
    });
  });

  describe("edge cases", () => {
    it("returns 0 with empty transactions", () => {
      const k = kpi();
      const result = evaluateKPI(k, [], NOW);
      expect(result.value).toBe(0);
    });

    it("returns 0 with no matching transactions for timeframe", () => {
      const k = kpi({ source_type: "income", timeframe: "this_month" });
      const transactions = [tx("income", 1000, at(2025, 0, 1))];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(0);
    });

    it("returns 0 with no matching transactions for scope", () => {
      const k = kpi({ source_type: "income", scope: "business" });
      const transactions = [tx("income", 1000, at(2026, 2, 5), "personal")];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(0);
    });

    it("handles transactions with zero amounts", () => {
      const k = kpi({ source_type: "income" });
      const transactions = [tx("income", 0, at(2026, 2, 5))];
      const result = evaluateKPI(k, transactions, NOW);
      expect(result.value).toBe(0);
    });

    it("uses default now parameter as current date", () => {
      const k = kpi({ source_type: "income", timeframe: "this_month" });
      const transactions = [tx("income", 100, new Date().toISOString())];
      const result = evaluateKPI(k, transactions);
      expect(result.value).toBe(100);
    });
  });
});

describe("evaluateKPIs", () => {
  it("returns results for all KPIs", () => {
    const kpis = [
      kpi({ id: "kpi-1", source_type: "income", operation: "sum" }),
      kpi({
        id: "kpi-2",
        source_type: "expense",
        operation: "budget_remaining",
        operand: 1000,
      }),
    ];
    const transactions = [
      tx("income", 5000, at(2026, 2, 5)),
      tx("expense", 300, at(2026, 2, 6)),
    ];
    const results = evaluateKPIs(kpis, transactions, NOW);
    expect(results).toHaveLength(2);
    expect(results[0].result.value).toBe(5000);
    expect(results[1].result.value).toBe(700);
  });

  it("returns empty array for empty KPIs", () => {
    const results = evaluateKPIs([], [], NOW);
    expect(results).toEqual([]);
  });
});
