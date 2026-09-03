import type { Transaction } from "@/types/transaction";

export type Delta = {
  value: number;
  percentage: number | null;
};

export type PayCycleConfig = {
  payday: number;
  expectedIncome: number;
  graceDays?: number;
  cycleTransactions?: Transaction[];
};

export type FreelanceConfig = {
  taxRate?: number;
  savingsRate?: number;
};

export type RollingAverage = {
  months: number;
  average: number | null;
  totalIncome: number;
  incomeMonths: number;
};

export type FreelanceSummary = {
  enabled: boolean;
  taxRate: number;
  taxReserve: number;
  monthlyTaxAccrual: number;
  savingsRate: number;
  monthlySavingsTarget: number;
  averages: {
    three: RollingAverage;
    six: RollingAverage;
    twelve: RollingAverage;
  };
};

export type PayCycleSummary = {
  enabled: boolean;
  cycleStart: string;
  cycleEnd: string;
  expectedIncome: number;
  actualIncome: number;
  expenses: number;
  savingsRate: number | null;
  received: boolean;
  overdue: boolean;
};

export type BusinessSummary = {
  enabled: boolean;
  profit: number;
  income: number;
  expenses: number;
  availableCash: number;
  monthlyBurn: number;
  runway: number | null;
};

export type Summary = {
  netBalance: number;
  monthlySpending: number;
  totalAssets: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number | null;
  payCycle: PayCycleSummary | null;
  freelance: FreelanceSummary | null;
  business: BusinessSummary | null;
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

export const PAY_CYCLE_GRACE_DAYS = 5;

export const DEFAULT_FREELANCE_TAX_RATE = 0.25;
export const DEFAULT_FREELANCE_SAVINGS_RATE = 0.1;
export const FREELANCE_AVERAGE_WINDOWS = [3, 6, 12] as const;

function paydayInMonth(year: number, month: number, payday: number): Date {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(Math.max(1, payday), daysInMonth);
  return new Date(year, month, day);
}

function previousPayday(payday: number, from: Date): Date {
  let year = from.getFullYear();
  let month = from.getMonth();
  for (let i = 0; i < 400; i++) {
    const candidate = paydayInMonth(year, month, payday);
    if (candidate <= from) return candidate;
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  return from;
}

function nextPayday(payday: number, from: Date): Date {
  let year = from.getFullYear();
  let month = from.getMonth() + 1;
  if (month > 11) {
    month = 0;
    year += 1;
  }
  return paydayInMonth(year, month, payday);
}

export function getPayCycleBounds(
  payday: number,
  now: Date = new Date()
): { currentStart: Date; currentEnd: Date; previousStart: Date } {
  const currentStart = previousPayday(payday, now);
  const currentEnd = nextPayday(payday, currentStart);
  const previousStart = paydayInMonth(
    currentStart.getFullYear(),
    currentStart.getMonth() - 1,
    payday
  );
  return { currentStart, currentEnd, previousStart };
}

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

function monthKey(year: number, month: number): number {
  return year * 12 + month;
}

function averageMonthlyBurn(
  transactions: Transaction[]
): number {
  const expensesByMonth = new Map<number, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const d = new Date(t.created_at);
    const key = monthKey(d.getFullYear(), d.getMonth());
    expensesByMonth.set(key, (expensesByMonth.get(key) ?? 0) + t.amount);
  }
  if (expensesByMonth.size === 0) return 0;
  let total = 0;
  for (const amount of expensesByMonth.values()) total += amount;
  return total / expensesByMonth.size;
}

function incomeByMonth(transactions: Transaction[]): Map<number, number> {
  const byMonth = new Map<number, number>();
  for (const t of transactions) {
    if (t.type !== "income") continue;
    const d = new Date(t.created_at);
    const key = monthKey(d.getFullYear(), d.getMonth());
    byMonth.set(key, (byMonth.get(key) ?? 0) + t.amount);
  }
  return byMonth;
}

function rollingAverage(
  byMonth: Map<number, number>,
  now: Date,
  months: number
): RollingAverage {
  const currentKey = monthKey(now.getFullYear(), now.getMonth());
  const startKey = currentKey - (months - 1);
  let totalIncome = 0;
  let incomeMonths = 0;
  for (const [key, amount] of byMonth) {
    if (key > currentKey) continue;
    if (key < startKey) continue;
    totalIncome += amount;
    incomeMonths += 1;
  }
  return {
    months,
    totalIncome,
    incomeMonths,
    average: incomeMonths === 0 ? null : totalIncome / incomeMonths,
  };
}

export function computeFreelanceSummary(
  transactions: Transaction[],
  now: Date = new Date(),
  options: FreelanceConfig = {}
): FreelanceSummary {
  const taxRate = options.taxRate ?? DEFAULT_FREELANCE_TAX_RATE;
  const savingsRate = options.savingsRate ?? DEFAULT_FREELANCE_SAVINGS_RATE;

  const byMonth = incomeByMonth(transactions);

  const currentKey = monthKey(now.getFullYear(), now.getMonth());
  const monthIncome = byMonth.get(currentKey) ?? 0;

  let taxReserve = 0;
  for (const t of transactions) {
    if (t.type !== "income") continue;
    taxReserve += t.amount * taxRate;
  }

  return {
    enabled: true,
    taxRate,
    taxReserve,
    monthlyTaxAccrual: monthIncome * taxRate,
    savingsRate,
    monthlySavingsTarget: monthIncome * savingsRate,
    averages: {
      three: rollingAverage(byMonth, now, 3),
      six: rollingAverage(byMonth, now, 6),
      twelve: rollingAverage(byMonth, now, 12),
    },
  };
}

export function computeBusinessSummary(
  transactions: Transaction[]
): BusinessSummary {
  const business = transactions.filter((t) => t.scope === "business");
  let income = 0;
  let expenses = 0;
  let totalAssets = 0;
  for (const t of business) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expenses += t.amount;
    else if (t.type === "asset") totalAssets += t.amount;
  }
  const profit = income - expenses;
  const availableCash = income + totalAssets - expenses;
  const monthlyBurn = averageMonthlyBurn(business);
  const runway = monthlyBurn > 0 ? availableCash / monthlyBurn : null;

  return {
    enabled: true,
    profit,
    income,
    expenses,
    availableCash,
    monthlyBurn,
    runway,
  };
}

export function computeSummary(
  transactions: Transaction[],
  now: Date = new Date(),
  options: {
    payCycle?: PayCycleConfig;
    freelance?: FreelanceConfig;
    business?: boolean;
  } = {}
): Summary {
  let income = 0;
  let expenses = 0;
  let totalAssets = 0;
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  let monthlySpending = 0;
  let lastIncome = 0;
  let lastExpenses = 0;

  const payCycleConfig = options.payCycle;
  const payday = payCycleConfig?.payday ?? null;
  const isCycle = payday !== null && payday > 0;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let cycleStart: Date | null = null;
  let cycleEnd: Date | null = null;
  let previousCycleStart: Date | null = null;

  if (isCycle) {
    const bounds = getPayCycleBounds(payday, now);
    cycleStart = bounds.currentStart;
    cycleEnd = bounds.currentEnd;
    previousCycleStart = bounds.previousStart;
  }

  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expenses += t.amount;
    else if (t.type === "asset") totalAssets += t.amount;
  }

  if (isCycle && cycleStart && cycleEnd && previousCycleStart) {
    const cycleTransactions = payCycleConfig?.cycleTransactions ?? [];
    for (const t of cycleTransactions) {
      const date = new Date(t.created_at);
      if (t.type === "income") {
        if (date >= cycleStart && date < cycleEnd) monthlyIncome += t.amount;
        else if (date >= previousCycleStart && date < cycleStart)
          lastIncome += t.amount;
      } else if (t.type === "expense") {
        if (date >= cycleStart && date < cycleEnd) {
          monthlySpending += t.amount;
          monthlyExpenses += t.amount;
        } else if (date >= previousCycleStart && date < cycleStart)
          lastExpenses += t.amount;
      }
    }
  } else {
    for (const t of transactions) {
      const date = new Date(t.created_at);
      if (t.type === "income") {
        if (date >= monthStart) monthlyIncome += t.amount;
        else if (date >= lastMonthStart) lastIncome += t.amount;
      } else if (t.type === "expense") {
        if (date >= monthStart) {
          monthlySpending += t.amount;
          monthlyExpenses += t.amount;
        } else if (date >= lastMonthStart) lastExpenses += t.amount;
      }
    }
  }

  const currentRate = monthlySavingsRate(monthlyIncome, monthlyExpenses);
  const lastRate = monthlySavingsRate(lastIncome, lastExpenses);

  const graceDays = payCycleConfig?.graceDays ?? PAY_CYCLE_GRACE_DAYS;
  const payCycle: PayCycleSummary | null =
    isCycle && payCycleConfig && cycleStart && cycleEnd
      ? {
          enabled: true,
          cycleStart: cycleStart.toISOString(),
          cycleEnd: cycleEnd.toISOString(),
          expectedIncome: payCycleConfig.expectedIncome,
          actualIncome: monthlyIncome,
          expenses: monthlyExpenses,
          savingsRate: currentRate,
          received: monthlyIncome >= payCycleConfig.expectedIncome,
          overdue:
            now.getTime() >
              new Date(
                cycleStart.getTime() + graceDays * 24 * 60 * 60 * 1000
              ).getTime() &&
            monthlyIncome < payCycleConfig.expectedIncome,
        }
      : null;

  return {
    netBalance: income + totalAssets - expenses,
    monthlySpending,
    totalAssets,
    monthlyIncome,
    monthlyExpenses,
    savingsRate: currentRate,
    payCycle,
    freelance: options.freelance
      ? computeFreelanceSummary(transactions, now, options.freelance)
      : null,
    business: options.business
      ? computeBusinessSummary(transactions)
      : null,
    deltas: {
      monthlySpending: moneyDelta(monthlySpending, lastExpenses),
      income: moneyDelta(monthlyIncome, lastIncome),
      expenses: moneyDelta(monthlyExpenses, lastExpenses),
      savingsRate:
        currentRate === null || lastRate === null
          ? null
          : { value: currentRate - lastRate, percentage: null },
    },
  };
}
