"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrajectoryPoint } from "@/lib/analytics";
import { useCurrencyFormatter } from "@/lib/currency/use-display-currency";

export default function SpendingTrajectoryChart({
  data,
}: {
  data: TrajectoryPoint[];
}) {
  const format = useCurrencyFormatter();

  if (data.length === 0) {
    return (
      <div className="card w-full bg-base-100 shadow">
        <div className="card-body items-center text-center">
          <h2 className="card-title">Spending Trajectory</h2>
          <p className="text-sm text-base-content/60">
            No spending data yet — your trajectory chart will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Spending Trajectory</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              aria-label="Monthly spending trajectory"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                label={{ value: "Day of Month", position: "bottom", offset: -5, fontSize: 12 }}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => format(v)} />
              <Tooltip formatter={(value) => format(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="currentMonthSpent"
                name="Current Month"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="lastMonthSpent"
                name="Prior Month"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
