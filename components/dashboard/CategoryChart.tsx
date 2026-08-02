"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryTotal } from "@/lib/summary";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

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

export default function CategoryChart({
  categories,
}: {
  categories: CategoryTotal[];
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
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart aria-label="Expenses grouped by category">
              <Pie
                data={categories}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, value }) =>
                  `${name}: ${currency.format(Number(value))}`
                }
              >
                {categories.map((entry, index) => (
                  <Cell
                    key={entry.category}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => currency.format(Number(value))}
                labelFormatter={(label) => label}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
