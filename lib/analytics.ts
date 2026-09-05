import type { Transaction } from "@/types/transaction";

export type ScopeFilter = "all" | "business" | "personal";

export type CashFlowMonth = {
  month: string;
  income: number;
  expense: number;
  net: number;
};

export type TrajectoryPoint = {
  day: number;
  currentMonthSpent: number;
  lastMonthSpent: number;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function monthKey(year: number, month: number): number {
  return year * 12 + month;
}

function inScope(t: Transaction, scope: ScopeFilter): boolean {
  return scope === "all" || t.scope === scope;
}

export function getCashFlow(
  transactions: Transaction[],
  scope: ScopeFilter = "all",
  now: Date = new Date()
): CashFlowMonth[] {
  const currentKey = monthKey(now.getFullYear(), now.getMonth());

  const incomeByMonth = new Map<number, number>();
  const expenseByMonth = new Map<number, number>();

  for (const t of transactions) {
    if (t.type !== "income" && t.type !== "expense") continue;
    if (!inScope(t, scope)) continue;
    const d = new Date(t.created_at);
    const key = monthKey(d.getFullYear(), d.getMonth());
    if (key > currentKey) continue;
    const bucket = t.type === "income" ? incomeByMonth : expenseByMonth;
    bucket.set(key, (bucket.get(key) ?? 0) + t.amount);
  }

  const months: CashFlowMonth[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const key = currentKey - offset;
    const year = Math.floor(key / 12);
    const month = key % 12;
    const income = incomeByMonth.get(key) ?? 0;
    const expense = expenseByMonth.get(key) ?? 0;
    months.push({
      month: `${MONTH_LABELS[month]} ${year}`,
      income,
      expense,
      net: income - expense,
    });
  }

  return months;
}

export function getTrajectory(
  transactions: Transaction[],
  scope: ScopeFilter = "all",
  now: Date = new Date()
): TrajectoryPoint[] {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  const currentByDay = new Array<number>(daysInMonth + 1).fill(0);
  const lastByDay = new Array<number>(daysInMonth + 1).fill(0);

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    if (!inScope(t, scope)) continue;
    const d = new Date(t.created_at);
    const isCurrent =
      d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    const isLast =
      d.getFullYear() === lastYear && d.getMonth() === lastMonth;
    if (isCurrent) {
      const day = d.getDate();
      if (day >= 1 && day <= daysInMonth) currentByDay[day] += t.amount;
    } else if (isLast) {
      const day = d.getDate();
      if (day >= 1 && day <= daysInMonth) lastByDay[day] += t.amount;
    }
  }

  const points: TrajectoryPoint[] = [];
  let currentRun = 0;
  let lastRun = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    currentRun += currentByDay[day];
    lastRun += lastByDay[day];
    points.push({
      day,
      currentMonthSpent: currentRun,
      lastMonthSpent: lastRun,
    });
  }

  return points;
}
