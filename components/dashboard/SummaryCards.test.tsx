import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SummaryCards from "@/components/dashboard/SummaryCards";
import type { Summary } from "@/lib/summary";

function makeSummary(overrides: Partial<Summary> = {}): Summary {
  return {
    netBalance: 0,
    monthlySpending: 0,
    totalAssets: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: null,
    payCycle: null,
    freelance: null,
    business: null,
    deltas: {
      monthlySpending: { value: 0, percentage: null },
      income: { value: 0, percentage: null },
      expenses: { value: 0, percentage: null },
      savingsRate: null,
    },
    ...overrides,
  };
}

const salariedSummary: Summary = makeSummary({
  netBalance: 15000,
  monthlyIncome: 5000,
  monthlySpending: 2000,
  monthlyExpenses: 2000,
  totalAssets: 10000,
  savingsRate: 0.6,
  payCycle: {
    enabled: true,
    cycleStart: "2026-02-01T00:00:00.000Z",
    cycleEnd: "2026-03-01T00:00:00.000Z",
    expectedIncome: 5000,
    actualIncome: 5000,
    expenses: 2000,
    savingsRate: 0.6,
    received: true,
    overdue: false,
  },
  deltas: {
    monthlySpending: { value: -1000, percentage: -33.33 },
    income: { value: 1000, percentage: 25 },
    expenses: { value: -1000, percentage: -33.33 },
    savingsRate: { value: 0.1, percentage: null },
  },
});

const freelancerSummary: Summary = makeSummary({
  netBalance: 9000,
  monthlyIncome: 3000,
  monthlySpending: 1200,
  monthlyExpenses: 1200,
  savingsRate: null,
  freelance: {
    enabled: true,
    taxRate: 0.25,
    taxReserve: 3750,
    monthlyTaxAccrual: 750,
    savingsRate: 0.1,
    monthlySavingsTarget: 300,
    averages: {
      three: { months: 3, average: 3000, totalIncome: 9000, incomeMonths: 3 },
      six: { months: 6, average: 3000, totalIncome: 18000, incomeMonths: 6 },
      twelve: {
        months: 12,
        average: 2750,
        totalIncome: 33000,
        incomeMonths: 12,
      },
    },
  },
});

const businessSummary: Summary = makeSummary({
  netBalance: 40000,
  monthlyIncome: 0,
  monthlySpending: 0,
  totalAssets: 0,
  business: {
    enabled: true,
    profit: 6500,
    income: 10000,
    expenses: 3500,
    availableCash: 6500,
    monthlyBurn: 350,
    runway: 18.57,
  },
});

describe("SummaryCards", () => {
  it("renders only the salaried card matrix", () => {
    render(
      <SummaryCards summary={salariedSummary} hasTransactions incomeType="salaried" />
    );

    expect(screen.getByText("Net Balance")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Spending")).toBeInTheDocument();
    expect(screen.getByText("Savings Rate")).toBeInTheDocument();

    expect(screen.queryByText("Expenses")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Assets")).not.toBeInTheDocument();
    expect(screen.queryByText("Rolling Income Averages")).not.toBeInTheDocument();
    expect(screen.queryByText("Tax Reserve")).not.toBeInTheDocument();
    expect(screen.queryByText("Profit")).not.toBeInTheDocument();
    expect(screen.queryByText("Runway")).not.toBeInTheDocument();
    expect(screen.queryByText("Pay Cycle")).not.toBeInTheDocument();
    expect(screen.queryByText("Savings Goal")).not.toBeInTheDocument();
  });

  it("renders only the hourly card matrix", () => {
    render(
      <SummaryCards summary={salariedSummary} hasTransactions incomeType="hourly" />
    );

    expect(screen.getByText("Net Balance")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Spending")).toBeInTheDocument();
    expect(screen.getByText("Savings Rate")).toBeInTheDocument();

    expect(screen.queryByText("Pay Cycle")).not.toBeInTheDocument();
    expect(screen.queryByText("Expenses")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Assets")).not.toBeInTheDocument();
    expect(screen.queryByText("Rolling Income Averages")).not.toBeInTheDocument();
    expect(screen.queryByText("Tax Reserve")).not.toBeInTheDocument();
  });

  it("renders only the freelancer card matrix", () => {
    render(
      <SummaryCards
        summary={freelancerSummary}
        hasTransactions
        incomeType="freelancer"
      />
    );

    expect(screen.getByText("Net Balance")).toBeInTheDocument();
    expect(screen.getByText("Rolling Income Averages")).toBeInTheDocument();
    expect(screen.getByText("Tax Reserve")).toBeInTheDocument();

    expect(screen.queryByText("Income")).not.toBeInTheDocument();
    expect(screen.queryByText("Spending")).not.toBeInTheDocument();
    expect(screen.queryByText("Savings Rate")).not.toBeInTheDocument();
    expect(screen.queryByText("Pay Cycle")).not.toBeInTheDocument();
    expect(screen.queryByText("Expenses")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Assets")).not.toBeInTheDocument();
    expect(screen.queryByText("Savings Goal")).not.toBeInTheDocument();
    expect(screen.queryByText("Profit")).not.toBeInTheDocument();
    expect(screen.queryByText("Runway")).not.toBeInTheDocument();
  });

  it("renders only the business card matrix", () => {
    render(
      <SummaryCards
        summary={businessSummary}
        hasTransactions
        incomeType="business"
      />
    );

    expect(screen.getByText("Net Balance")).toBeInTheDocument();
    expect(screen.getByText("Profit")).toBeInTheDocument();
    expect(screen.getByText("Runway")).toBeInTheDocument();

    expect(screen.queryByText("Income")).not.toBeInTheDocument();
    expect(screen.queryByText("Spending")).not.toBeInTheDocument();
    expect(screen.queryByText("Savings Rate")).not.toBeInTheDocument();
    expect(screen.queryByText("Rolling Income Averages")).not.toBeInTheDocument();
    expect(screen.queryByText("Tax Reserve")).not.toBeInTheDocument();
    expect(screen.queryByText("Expenses")).not.toBeInTheDocument();
    expect(screen.queryByText("Total Assets")).not.toBeInTheDocument();
  });

  it("matches the salaried snapshot", () => {
    const { container } = render(
      <SummaryCards summary={salariedSummary} hasTransactions incomeType="salaried" />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches the freelancer snapshot", () => {
    const { container } = render(
      <SummaryCards
        summary={freelancerSummary}
        hasTransactions
        incomeType="freelancer"
      />
    );
    expect(container).toMatchSnapshot();
  });

  it("matches the business snapshot", () => {
    const { container } = render(
      <SummaryCards
        summary={businessSummary}
        hasTransactions
        incomeType="business"
      />
    );
    expect(container).toMatchSnapshot();
  });

  it("shows the empty-state hint only when there are no transactions", () => {
    const { rerender } = render(
      <SummaryCards summary={salariedSummary} hasTransactions={false} incomeType="salaried" />
    );
    expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();

    rerender(
      <SummaryCards summary={salariedSummary} hasTransactions incomeType="salaried" />
    );
    expect(screen.queryByText(/no transactions yet/i)).not.toBeInTheDocument();
  });
});
