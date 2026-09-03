"use client";

import {
  Landmark,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Summary } from "@/lib/summary";
import { useCurrencyFormatter } from "@/lib/currency/use-display-currency";
import { formatMoneyDelta, formatRateDelta } from "@/lib/format";

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="stat rounded-box bg-base-100 shadow">
          <div className="stat-figure text-primary">
            <Wallet className="h-8 w-8" />
          </div>
          <div className="stat-title">Net Balance</div>
          <div className="stat-value text-2xl">
            {format(summary.netBalance)}
          </div>
          <div className="stat-desc">Income + Assets − Expenses</div>
        </div>
        <div className="stat rounded-box bg-base-100 shadow">
          <div className="stat-figure text-success">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div className="stat-title">Income</div>
          <div className="stat-value text-2xl">
            {format(summary.monthlyIncome)}
          </div>
          <div className="stat-desc">
            vs last month {formatMoneyDelta(summary.deltas.income, format)}
          </div>
        </div>
        <div className="stat rounded-box bg-base-100 shadow">
          <div className="stat-figure text-error">
            <TrendingDown className="h-8 w-8" />
          </div>
          <div className="stat-title">Expenses</div>
          <div className="stat-value text-2xl">
            {format(summary.monthlyExpenses)}
          </div>
          <div className="stat-desc">
            vs last month {formatMoneyDelta(summary.deltas.expenses, format)}
          </div>
        </div>
        <div className="stat rounded-box bg-base-100 shadow">
          <div className="stat-figure text-secondary">
            <Receipt className="h-8 w-8" />
          </div>
          <div className="stat-title">Monthly Spending</div>
          <div className="stat-value text-2xl">
            {format(summary.monthlySpending)}
          </div>
          <div className="stat-desc">
            vs last month{" "}
            {formatMoneyDelta(summary.deltas.monthlySpending, format)}
          </div>
        </div>
        <div className="stat rounded-box bg-base-100 shadow">
          <div className="stat-figure text-info">
            <PiggyBank className="h-8 w-8" />
          </div>
          <div className="stat-title">Savings Rate</div>
          <div className="stat-value text-2xl">
            {summary.savingsRate === null
              ? "—"
              : percent.format(summary.savingsRate)}
          </div>
          <div className="stat-desc">
            vs last month{" "}
            {summary.deltas.savingsRate === null
              ? "—"
              : formatRateDelta(summary.deltas.savingsRate)}
          </div>
        </div>
        <div className="stat rounded-box bg-base-100 shadow">
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
