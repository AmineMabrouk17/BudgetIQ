"use client";

import {
  CalendarClock,
  Coins,
  Landmark,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Summary } from "@/lib/summary";
import { useCurrencyFormatter } from "@/lib/currency/use-display-currency";
import { formatDate, formatMoneyDelta, formatRateDelta } from "@/lib/format";

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const months = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

function fmtAvg(
  avg: { average: number | null; incomeMonths: number },
  format: (amount: number) => string
): string {
  return avg.average === null ? "—" : format(avg.average);
}

export default function SummaryCards({
  summary,
  hasTransactions,
}: {
  summary: Summary;
  hasTransactions: boolean;
}) {
  const format = useCurrencyFormatter();
  const isBusiness = summary.business?.enabled === true;
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
        {isBusiness ? (
          <>
            <div className="stat rounded-box bg-base-100 shadow">
              <div className="stat-figure text-success">
                <TrendingUp className="h-8 w-8" />
              </div>
              <div className="stat-title">Profit</div>
              <div className="stat-value text-2xl">
                {format(summary.business?.profit ?? 0)}
              </div>
              <div className="stat-desc">
                Business income − business costs
              </div>
            </div>
            {summary.business && (
              <div className="stat rounded-box bg-base-100 shadow">
                <div className="stat-figure text-info">
                  <CalendarClock className="h-8 w-8" />
                </div>
                <div className="stat-title">Runway</div>
                <div className="stat-value text-2xl">
                  {summary.business.runway === null
                    ? "—"
                    : `${months.format(summary.business.runway)} mo`}
                </div>
                <div className="stat-desc">
                  {summary.business.monthlyBurn > 0
                    ? `${format(summary.business.monthlyBurn)}/mo burn`
                    : "No business expenses yet"}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="stat rounded-box bg-base-100 shadow">
            <div className="stat-figure text-success">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div className="stat-title">Income</div>
            <div className="stat-value text-2xl">
              {format(summary.monthlyIncome)}
            </div>
            <div className="stat-desc">
              {summary.payCycle?.enabled
                ? `of ${format(summary.payCycle.expectedIncome)} this pay cycle`
                : `vs last month ${formatMoneyDelta(summary.deltas.income, format)}`}
            </div>
          </div>
        )}
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
        {!isBusiness && (
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
        )}
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
        {summary.payCycle?.enabled && (
          <div className="stat rounded-box bg-base-100 shadow">
            <div className="stat-figure text-warning">
              <CalendarClock className="h-8 w-8" />
            </div>
            <div className="stat-title">Pay Cycle</div>
            <div className="stat-value text-2xl">
              {format(summary.payCycle.actualIncome)}
              <span className="text-base-content/50 text-sm">
                {" "}
                / {format(summary.payCycle.expectedIncome)}
              </span>
            </div>
            <div className="stat-desc">
              {summary.payCycle.overdue ? (
                <span className="font-semibold text-error">
                  Overdue — expected income not logged
                </span>
              ) : summary.payCycle.received ? (
                "Cycle income received"
              ) : (
                `Expected by ${formatDate(summary.payCycle.cycleEnd)}`
              )}
            </div>
          </div>
        )}
        {summary.freelance?.enabled && (
          <>
            <div className="stat rounded-box bg-base-100 shadow">
              <div className="stat-figure text-primary">
                <TrendingUp className="h-8 w-8" />
              </div>
              <div className="stat-title">Rolling Income Averages</div>
              <div className="stat-value text-2xl">
                {summary.freelance.averages.three.average === null
                  ? "—"
                  : format(summary.freelance.averages.three.average)}
              </div>
              <div className="stat-desc">
                3-mo{" "}
                {fmtAvg(summary.freelance.averages.three, format)} · 6-mo{" "}
                {fmtAvg(summary.freelance.averages.six, format)} · 12-mo{" "}
                {fmtAvg(summary.freelance.averages.twelve, format)}
              </div>
            </div>
            <div className="stat rounded-box bg-base-100 shadow">
              <div className="stat-figure text-error">
                <Coins className="h-8 w-8" />
              </div>
              <div className="stat-title">Tax Reserve</div>
              <div className="stat-value text-2xl">
                {format(summary.freelance.taxReserve)}
              </div>
              <div className="stat-desc">
                {percent.format(summary.freelance.taxRate)} of income set aside
                · +{format(summary.freelance.monthlyTaxAccrual)} this month
              </div>
            </div>
            <div className="stat rounded-box bg-base-100 shadow">
              <div className="stat-figure text-secondary">
                <PiggyBank className="h-8 w-8" />
              </div>
              <div className="stat-title">Savings Goal</div>
              <div className="stat-value text-2xl">
                {format(summary.freelance.monthlySavingsTarget)}
              </div>
              <div className="stat-desc">
                {percent.format(summary.freelance.savingsRate)} of realized
                income this month
              </div>
            </div>
          </>
        )}
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
