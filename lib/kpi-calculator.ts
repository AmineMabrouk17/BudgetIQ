import type { Transaction } from "@/types/transaction";
import type { CustomKPI, KpiScope, KpiTimeframe } from "@/types/kpi";

export type KPIResult = {
  value: number;
  subtitle: string;
};

export type EvaluatedKPI = {
  kpi: CustomKPI;
  result: KPIResult;
};

function scopeFilter(t: Transaction, scope: KpiScope): boolean {
  if (scope === "all") return true;
  return t.scope === scope;
}

function timeFilter(t: Transaction, timeframe: KpiTimeframe, now: Date): boolean {
  const d = new Date(t.created_at);
  switch (timeframe) {
    case "this_month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return d >= monthStart && d < nextMonthStart;
    }
    case "last_month": {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return d >= lastMonthStart && d < monthStart;
    }
    case "last_30_days": {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return d >= thirtyDaysAgo && d <= now;
    }
    case "year_to_date": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return d >= yearStart && d <= now;
    }
    case "all_time":
      return true;
  }
}

function computeBaseAmount(kpi: CustomKPI, transactions: Transaction[], now: Date): number {
  const filtered = transactions.filter(
    (t) => scopeFilter(t, kpi.scope) && timeFilter(t, kpi.timeframe, now)
  );

  switch (kpi.source_type) {
    case "income":
      return filtered
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    case "expense":
      return filtered
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    case "category": {
      const catFilter = (kpi.category_filter ?? "").toLowerCase();
      return filtered
        .filter((t) => t.type === "expense" && t.category.toLowerCase() === catFilter)
        .reduce((sum, t) => sum + t.amount, 0);
    }

    case "balance":
      return filtered.reduce((sum, t) => {
        if (t.type === "income" || t.type === "asset") return sum + t.amount;
        if (t.type === "expense") return sum - t.amount;
        return sum;
      }, 0);
  }
}

function applyOperation(
  base: number,
  operation: CustomKPI["operation"],
  operand: number
): KPIResult {
  switch (operation) {
    case "sum":
      return { value: base, subtitle: "" };

    case "percentage": {
      const value = base * operand;
      const pct = Math.round(operand * 100);
      return { value, subtitle: `${pct}% of ${base > 0 ? "expense" : "source"}` };
    }

    case "budget_remaining": {
      const value = operand - base;
      return { value, subtitle: `Remaining of ${operand} limit` };
    }
  }
}

export function evaluateKPI(
  kpi: CustomKPI,
  transactions: Transaction[],
  now: Date = new Date()
): KPIResult {
  const base = computeBaseAmount(kpi, transactions, now);
  return applyOperation(base, kpi.operation, kpi.operand);
}

export function evaluateKPIs(
  kpis: CustomKPI[],
  transactions: Transaction[],
  now: Date = new Date()
): EvaluatedKPI[] {
  return kpis.map((kpi) => ({
    kpi,
    result: evaluateKPI(kpi, transactions, now),
  }));
}
