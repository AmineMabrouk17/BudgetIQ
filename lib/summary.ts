import type { Transaction } from "@/types/transaction";

export type Delta = {
  value: number;
  percentage: number | null;
};

export type Summary = {
  netBalance: number;
  monthlySpending: number;
  totalAssets: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number | null;
  deltas: {
    monthlySpending: Delta;
    income: Delta;
    expenses: Delta;
    savingsRate: Delta | null;
  };
};

export type CategoryTotal = {
  category: string;
  amount: number;
};

export function groupExpensesByCategory(
  transactions: Transaction[]
): CategoryTotal[] {
  const totals = new Map<string, number>();

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function moneyDelta(current: number, previous: number): Delta {
  const value = current - previous;
  const percentage =
    previous === 0 ? null : ((current - previous) / previous) * 100;
  return { value, percentage };
}

function monthlySavingsRate(income: number, expenses: number): number | null {
  return income === 0 ? null : (income - expenses) / income;
}

export function computeSummary(
  transactions: Transaction[],
  now: Date = new Date()
): Summary {
  let income = 0;
  let expenses = 0;
  let totalAssets = 0;
  let monthlySpending = 0;
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  let lastMonthIncome = 0;
  let lastMonthExpenses = 0;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  for (const t of transactions) {
    const date = new Date(t.created_at);
    if (t.type === "income") {
      income += t.amount;
      if (date >= monthStart) monthlyIncome += t.amount;
      else if (date >= lastMonthStart) lastMonthIncome += t.amount;
    } else if (t.type === "expense") {
      expenses += t.amount;
      if (date >= monthStart) {
        monthlySpending += t.amount;
        monthlyExpenses += t.amount;
      } else if (date >= lastMonthStart) lastMonthExpenses += t.amount;
    } else if (t.type === "asset") totalAssets += t.amount;
  }

  const currentRate = monthlySavingsRate(monthlyIncome, monthlyExpenses);
  const lastRate = monthlySavingsRate(lastMonthIncome, lastMonthExpenses);

  return {
    netBalance: income + totalAssets - expenses,
    monthlySpending,
    totalAssets,
    monthlyIncome,
    monthlyExpenses,
    savingsRate: currentRate,
    deltas: {
      monthlySpending: moneyDelta(monthlySpending, lastMonthExpenses),
      income: moneyDelta(monthlyIncome, lastMonthIncome),
      expenses: moneyDelta(monthlyExpenses, lastMonthExpenses),
      savingsRate:
        currentRate === null || lastRate === null
          ? null
          : { value: currentRate - lastRate, percentage: null },
    },
  };
}
