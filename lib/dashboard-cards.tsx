"use client";

import type { ReactNode } from "react";
import {
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Summary } from "@/lib/summary";
import { formatMoneyDelta, formatRateDelta } from "@/lib/format";

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export type CardId = "netBalance" | "income" | "spending" | "savingsRate";

export type CardContext = {
  summary: Summary;
  format: (amount: number) => string;
};

export type CardDefinition = {
  id: CardId;
  title: string;
  icon: LucideIcon;
  iconClass: string;
  renderValue: (ctx: CardContext) => ReactNode;
  renderSubtitle: (ctx: CardContext) => ReactNode;
};

export const SUMMARY_CARDS: CardDefinition[] = [
  {
    id: "netBalance",
    title: "Net Balance",
    icon: Wallet,
    iconClass: "text-primary",
    renderValue: ({ summary, format }) => format(summary.netBalance),
    renderSubtitle: () => "Income + Assets − Expenses",
  },
  {
    id: "income",
    title: "Income",
    icon: TrendingUp,
    iconClass: "text-success",
    renderValue: ({ summary, format }) => format(summary.monthlyIncome),
    renderSubtitle: ({ summary, format }) =>
      `vs last month ${formatMoneyDelta(summary.deltas.income, format)}`,
  },
  {
    id: "spending",
    title: "Spending",
    icon: TrendingDown,
    iconClass: "text-error",
    renderValue: ({ summary, format }) => format(summary.monthlySpending),
    renderSubtitle: ({ summary, format }) =>
      `vs last month ${formatMoneyDelta(
        summary.deltas.monthlySpending,
        format
      )}`,
  },
  {
    id: "savingsRate",
    title: "Savings Rate",
    icon: PiggyBank,
    iconClass: "text-info",
    renderValue: ({ summary }) =>
      summary.savingsRate === null ? "—" : percent.format(summary.savingsRate),
    renderSubtitle: ({ summary }) =>
      summary.deltas.savingsRate === null
        ? "—"
        : `vs last month ${formatRateDelta(summary.deltas.savingsRate)}`,
  },
];
