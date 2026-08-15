import {
  Landmark,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Delta, Summary } from "@/lib/summary";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

function formatMoneyDelta(delta: Delta): string {
  const valueSign = delta.value > 0 ? "+" : delta.value < 0 ? "−" : "";
  const value = `${valueSign}${currency.format(Math.abs(delta.value))}`;
  if (delta.percentage === null) return value;
  const pctSign = delta.percentage > 0 ? "+" : delta.percentage < 0 ? "−" : "";
  return `${value} (${pctSign}${Math.abs(delta.percentage).toFixed(1)}%)`;
}

function formatRateDelta(delta: Delta): string {
  const sign = delta.value > 0 ? "+" : delta.value < 0 ? "−" : "";
  return `${sign}${Math.abs(delta.value * 100).toFixed(1)} pp`;
}

export default function SummaryCards({
  summary,
  hasTransactions,
}: {
  summary: Summary;
  hasTransactions: boolean;
}) {
  return (
    <section aria-label="Financial summary">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="stat rounded-box bg-base-100 shadow">
          <div className="stat-figure text-primary">
            <Wallet className="h-8 w-8" />
          </div>
          <div className="stat-title">Net Balance</div>
          <div className="stat-value text-2xl">
            {currency.format(summary.netBalance)}
          </div>
          <div className="stat-desc">Income + Assets − Expenses</div>
        </div>
        <div className="stat rounded-box bg-base-100 shadow">
          <div className="stat-figure text-success">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div className="stat-title">Income</div>
          <div className="stat-value text-2xl">
            {currency.format(summary.monthlyIncome)}
          </div>
          <div className="stat-desc">
            vs last month {formatMoneyDelta(summary.deltas.income)}
          </div>
        </div>
        <div className="stat rounded-box bg-base-100 shadow">
          <div className="stat-figure text-error">
            <TrendingDown className="h-8 w-8" />
          </div>
          <div className="stat-title">Expenses</div>
          <div className="stat-value text-2xl">
            {currency.format(summary.monthlyExpenses)}
          </div>
          <div className="stat-desc">
            vs last month {formatMoneyDelta(summary.deltas.expenses)}
          </div>
        </div>
        <div className="stat rounded-box bg-base-100 shadow">
          <div className="stat-figure text-secondary">
            <Receipt className="h-8 w-8" />
          </div>
          <div className="stat-title">Monthly Spending</div>
          <div className="stat-value text-2xl">
            {currency.format(summary.monthlySpending)}
          </div>
          <div className="stat-desc">
            vs last month{" "}
            {formatMoneyDelta(summary.deltas.monthlySpending)}
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
            {currency.format(summary.totalAssets)}
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
