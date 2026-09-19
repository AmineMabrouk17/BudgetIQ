"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrajectoryPoint } from "@/lib/analytics";
import { useCurrencyFormatter } from "@/lib/currency/use-display-currency";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
    color: string;
  }>;
  label?: number | string;
  format: (value: number) => string;
}

function CustomTooltip({ active, payload, label, format }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const current = payload.find((p) => p.dataKey === "currentMonthSpent");
  const previous = payload.find((p) => p.dataKey === "lastMonthSpent");

  return (
    <div className="rounded-xl border border-base-content/10 bg-base-100/90 p-3 shadow-xl backdrop-blur-md">
      <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
        Day {label}
      </p>
      <div className="mt-2 space-y-1.5">
        {current && (
          <div className="flex items-center justify-between gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-indigo-500">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Current Month:
            </span>
            <span className="font-semibold text-base-content">
              {format(Number(current.value))}
            </span>
          </div>
        )}
        {previous && (
          <div className="flex items-center justify-between gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Prior Month:
            </span>
            <span className="text-base-content/70">
              {format(Number(previous.value))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SpendingTrajectoryChart({
  data,
}: {
  data: TrajectoryPoint[];
}) {
  const format = useCurrencyFormatter();

  if (data.length === 0) {
    return (
      <div className="card w-full border border-base-content/5 bg-base-100 shadow-sm">
        <div className="card-body items-center p-8 text-center">
          <div className="rounded-full bg-base-200/60 p-3 text-base-content/40 mb-1">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-base-content">
            Spending Trajectory
          </h2>
          <p className="text-xs text-base-content/60">
            No spending data yet — your trajectory chart will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full border border-base-content/5 bg-base-100 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="card-body p-6">
        {/* Header with Title and custom Legend */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-base-content">
              Spending Trajectory
            </h2>
            <p className="text-xs text-base-content/50">
              Cumulative month-to-date spending vs. prior month
            </p>
          </div>

          {/* Clean inline legend */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/20" />
              <span className="text-base-content/70">Current Month</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400 ring-2 ring-slate-400/20" />
              <span className="text-base-content/50">Prior Month</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              aria-label="Monthly spending trajectory"
            >
              <defs>
                <linearGradient
                  id="spendingGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              {/* Minimal horizontal-only grid */}
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="opacity-10"
              />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-base-content/50"
                dy={6}
                tickFormatter={(d) => `${d}`}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-base-content/50"
                tickFormatter={(v) => format(v)}
                width={70}
                dx={-6}
              />

              <Tooltip
                content={<CustomTooltip format={format} />}
                cursor={{
                  stroke: "currentColor",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                  className: "opacity-20",
                }}
              />

              {/* Prior Month - Subtle dashed reference line */}
              <Line
                type="monotone"
                dataKey="lastMonthSpent"
                name="Prior Month"
                stroke="#94a3b8"
                strokeWidth={1.75}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "#94a3b8" }}
              />

              {/* Current Month - Glowing gradient filled area */}
              <Area
                type="monotone"
                dataKey="currentMonthSpent"
                name="Current Month"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#spendingGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: "#ffffff",
                  fill: "#6366f1",
                  className: "drop-shadow-md",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}