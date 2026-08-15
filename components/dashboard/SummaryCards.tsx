"use client";

import { Landmark, Receipt, Wallet } from "lucide-react";
import type { Summary } from "@/lib/summary";
import { useCurrencyFormatter } from "@/lib/use-display-currency";

export default function SummaryCards({
  summary,
  hasTransactions,
}: {
  summary: Summary;
  hasTransactions: boolean;
}) {
  const format = useCurrencyFormatter();
  return (
    <section aria-label="Financial summary">
      <div className="stats stats-vertical w-full shadow lg:stats-horizontal">
        <div className="stat">
          <div className="stat-figure text-primary">
            <Wallet className="h-8 w-8" />
          </div>
          <div className="stat-title">Net Balance</div>
          <div className="stat-value text-2xl">
            {format(summary.netBalance)}
          </div>
          <div className="stat-desc">Income + Assets − Expenses</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-secondary">
            <Receipt className="h-8 w-8" />
          </div>
          <div className="stat-title">Monthly Spending</div>
          <div className="stat-value text-2xl">
            {format(summary.monthlySpending)}
          </div>
          <div className="stat-desc">Expenses this calendar month</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-accent">
            <Landmark className="h-8 w-8" />
          </div>
          <div className="stat-title">Total Assets</div>
          <div className="stat-value text-2xl">
            {format(summary.totalAssets)}
          </div>
          <div className="stat-desc">Sum of asset accounts</div>
        </div>
      </div>
      {!hasTransactions && (
        <p className="mt-3 text-sm text-base-content/60">
          No transactions yet — add your first one and your summary will update
          live.
        </p>
      )}
    </section>
  );
}
