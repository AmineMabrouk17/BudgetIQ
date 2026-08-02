import type { Transaction } from "@/types/transaction";

export type Summary = {
  netBalance: number;
  monthlySpending: number;
  totalAssets: number;
};

export function computeSummary(
  transactions: Transaction[],
  now: Date = new Date()
): Summary {
  let income = 0;
  let expenses = 0;
  let totalAssets = 0;
  let monthlySpending = 0;

  const year = now.getFullYear();
  const month = now.getMonth();

  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") {
      expenses += t.amount;
      const date = new Date(t.created_at);
      if (date.getFullYear() === year && date.getMonth() === month) {
        monthlySpending += t.amount;
      }
    } else if (t.type === "asset") totalAssets += t.amount;
  }

  return {
    netBalance: income + totalAssets - expenses,
    monthlySpending,
    totalAssets,
  };
}
