"use client";

import { useState, useEffect, useMemo } from "react";
import type { Transaction } from "@/types/transaction";
import { getCashFlow, getTrajectory } from "@/lib/analytics";
import { groupExpensesByCategory } from "@/lib/summary";
import { useCurrencyFormatter } from "@/lib/currency/use-display-currency";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import SpendingTrajectoryChart from "@/components/dashboard/SpendingTrajectoryChart";
import CategoryChart from "@/components/dashboard/CategoryChart";

type TabKey = "cashflow" | "trajectory" | "categories";
type CategoryView = "donut" | "ranked";

const TABS: { key: TabKey; label: string }[] = [
  { key: "cashflow", label: "Cash Flow" },
  { key: "trajectory", label: "Spending Trajectory" },
  { key: "categories", label: "Category Breakdown" },
];

const STORAGE_KEY = "analytics-tab";

function getStoredTab(): TabKey {
  if (typeof window === "undefined") return "cashflow";
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored && TABS.some((t) => t.key === stored)) return stored as TabKey;
  return "cashflow";
}

export default function AnalyticsContainer({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>(getStoredTab);
  const [categoryView, setCategoryView] = useState<CategoryView>("donut");
  const format = useCurrencyFormatter();

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, activeTab);
  }, [activeTab]);

  const cashFlowData = useMemo(() => getCashFlow(transactions), [transactions]);
  const trajectoryData = useMemo(() => getTrajectory(transactions), [transactions]);
  const categories = useMemo(
    () => groupExpensesByCategory(transactions),
    [transactions]
  );

  const totalAmount = useMemo(
    () => categories.reduce((sum, c) => sum + c.amount, 0),
    [categories]
  );

  return (
    <div className="card w-full bg-base-100 shadow">
      <div className="card-body gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="join">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`btn btn-sm join-item ${
                  activeTab === tab.key ? "btn-active" : ""
                }`}
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={activeTab === tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "categories" && categories.length > 0 && (
            <div className="join">
              <button
                className={`btn btn-xs join-item ${
                  categoryView === "donut" ? "btn-active" : ""
                }`}
                onClick={() => setCategoryView("donut")}
                aria-pressed={categoryView === "donut"}
              >
                Donut
              </button>
              <button
                className={`btn btn-xs join-item ${
                  categoryView === "ranked" ? "btn-active" : ""
                }`}
                onClick={() => setCategoryView("ranked")}
                aria-pressed={categoryView === "ranked"}
              >
                Ranked
              </button>
            </div>
          )}
        </div>

        {activeTab === "cashflow" && <CashFlowChart data={cashFlowData} />}

        {activeTab === "trajectory" && (
          <SpendingTrajectoryChart data={trajectoryData} />
        )}

        {activeTab === "categories" && (
          <>
            {categoryView === "donut" && (
              <CategoryChart categories={categories} />
            )}
            {categoryView === "ranked" && (
              <RankedCategoryList
                categories={categories}
                totalAmount={totalAmount}
                format={format}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

const COLORS = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

function RankedCategoryList({
  categories,
  totalAmount,
  format,
}: {
  categories: { category: string; amount: number }[];
  totalAmount: number;
  format: (amount: number) => string;
}) {
  if (categories.length === 0) {
    return (
      <div className="card w-full bg-base-100 shadow">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Spending by Category</h2>
          <p className="text-sm text-base-content/60">
            No expenses yet — your category breakdown will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Spending by Category</h2>
        <ul className="flex flex-col gap-2">
          {categories.map((cat, index) => {
            const pct = totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0;
            return (
              <li key={cat.category} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                    {cat.category}
                  </span>
                  <span className="font-medium">{format(cat.amount)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-base-300">
                  <div
                    className="h-full rounded-full transition-all duration-300 motion-reduce:transition-none"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                </div>
                <span className="text-xs text-base-content/60">
                  {pct.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
