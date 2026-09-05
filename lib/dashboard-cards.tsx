"use client";

import type { ReactNode } from "react";
import {
  CalendarClock,
  Coins,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Summary } from "@/lib/summary";
import type { IncomeType } from "@/lib/profiles";
import { formatMoneyDelta, formatRateDelta } from "@/lib/format";

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

export type CardId =
  | "netBalance"
  | "income"
  | "spending"
  | "savingsRate"
  | "rollingAverages"
  | "taxReserve"
  | "businessProfit"
  | "businessRunway";

export type CardContext = {
  summary: Summary;
  format: (amount: number) => string;
};

export type CardDefinition = {
  id: CardId;
  personas: IncomeType[];
  title: string;
  icon: LucideIcon;
  iconClass: string;
  renderValue: (ctx: CardContext) => ReactNode;
  renderSubtitle: (ctx: CardContext) => ReactNode;
};

export const CARD_REGISTRY: CardDefinition[] = [
  {
    id: "netBalance",
    personas: ["salaried", "hourly", "freelancer", "business"],
    title: "Net Balance",
    icon: Wallet,
    iconClass: "text-primary",
    renderValue: ({ summary, format }) => format(summary.netBalance),
    renderSubtitle: () => "Income + Assets − Expenses",
  },
  {
    id: "income",
    personas: ["salaried", "hourly"],
    title: "Income",
    icon: TrendingUp,
    iconClass: "text-success",
    renderValue: ({ summary, format }) => format(summary.monthlyIncome),
    renderSubtitle: ({ summary, format }) =>
      summary.payCycle?.enabled
        ? `of ${format(summary.payCycle.expectedIncome)} this pay cycle`
        : `vs last month ${formatMoneyDelta(summary.deltas.income, format)}`,
  },
  {
    id: "spending",
    personas: ["salaried", "hourly"],
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
    personas: ["salaried", "hourly"],
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
  {
    id: "rollingAverages",
    personas: ["freelancer"],
    title: "Rolling Income Averages",
    icon: TrendingUp,
    iconClass: "text-primary",
    renderValue: ({ summary, format }) =>
      summary.freelance && summary.freelance.averages.three.average !== null
        ? format(summary.freelance.averages.three.average)
        : "—",
    renderSubtitle: ({ summary, format }) =>
      summary.freelance
        ? `3-mo ${fmtAvg(summary.freelance.averages.three, format)} · 6-mo ${fmtAvg(
            summary.freelance.averages.six,
            format
          )} · 12-mo ${fmtAvg(
            summary.freelance.averages.twelve,
            format
          )}`
        : "—",
  },
  {
    id: "taxReserve",
    personas: ["freelancer"],
    title: "Tax Reserve",
    icon: Coins,
    iconClass: "text-error",
    renderValue: ({ summary, format }) =>
      format(summary.freelance?.taxReserve ?? 0),
    renderSubtitle: ({ summary, format }) =>
      summary.freelance
        ? `${percent.format(summary.freelance.taxRate)} of income set aside · +${format(
            summary.freelance.monthlyTaxAccrual
          )} this month`
        : "",
  },
  {
    id: "businessProfit",
    personas: ["business"],
    title: "Profit",
    icon: TrendingUp,
    iconClass: "text-success",
    renderValue: ({ summary, format }) =>
      format(summary.business?.profit ?? 0),
    renderSubtitle: () => "Business income − business costs",
  },
  {
    id: "businessRunway",
    personas: ["business"],
    title: "Runway",
    icon: CalendarClock,
    iconClass: "text-info",
    renderValue: ({ summary }) =>
      summary.business?.runway === null || !summary.business
        ? "—"
        : `${months.format(summary.business.runway)} mo`,
    renderSubtitle: ({ summary, format }) => {
      const business = summary.business;
      if (!business) return "";
      return business.monthlyBurn > 0
        ? `${format(business.monthlyBurn)}/mo burn`
        : "No business expenses yet";
    },
  },
];

export const DEFAULT_INCOME_TYPE: IncomeType = "salaried";

export function cardsForPersona(
  incomeType: IncomeType
): CardDefinition[] {
  return CARD_REGISTRY.filter((card) => card.personas.includes(incomeType));
}
