"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CashFlowMonth } from "@/lib/analytics";
import { useCurrencyFormatter } from "@/lib/currency/use-display-currency";

export default function CashFlowChart({
  data,
}: {
  data: CashFlowMonth[];
}) {
  const format = useCurrencyFormatter();

  if (data.length === 0) {
    return (
      <div className="card w-full bg-base-100 shadow">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Cash Flow</h2>
          <p className="text-sm text-base-content/60">
            No transactions yet — your cash flow chart will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Cash Flow</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              aria-label="Monthly cash flow"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => format(v)} />
              <Tooltip formatter={(value) => format(Number(value))} />
              <Legend />
              <Bar
                dataKey="income"
                name="Income"
                fill="#22c55e"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="#ef4444"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
