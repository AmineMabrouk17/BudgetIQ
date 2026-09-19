import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SummaryCards from "@/components/dashboard/SummaryCards";
import type { Summary } from "@/lib/summary";
import type { EvaluatedKPI } from "@/lib/kpi-calculator";

const listCustomKPIs = vi.fn();
const deleteCustomKPI = vi.fn();

vi.mock("@/app/actions/kpis", () => ({
  listCustomKPIs: (...args: unknown[]) => listCustomKPIs(...args),
  deleteCustomKPI: (...args: unknown[]) => deleteCustomKPI(...args),
}));

HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};

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

function makeEvaluatedKPI(
  overrides: Partial<EvaluatedKPI> = {}
): EvaluatedKPI {
  return {
    kpi: {
      id: "kpi-1",
      user_id: "user-1",
      title: "My Metric",
      source_type: "income",
      category_filter: null,
      scope: "all",
      timeframe: "this_month",
      operation: "sum",
      operand: 1,
      sort_order: 0,
      created_at: "2026-09-01T00:00:00.000Z",
      ...(overrides.kpi ?? {}),
    },
    result: {
      value: 250,
      subtitle: "this month",
      ...(overrides.result ?? {}),
    },
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

beforeEach(() => {
  listCustomKPIs.mockReset();
  deleteCustomKPI.mockReset();
  listCustomKPIs.mockResolvedValue({ ok: true, kpis: [] });
});

describe("SummaryCards", () => {
  it("renders only the salaried card matrix", async () => {
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

  it("renders only the hourly card matrix", async () => {
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

  it("renders only the freelancer card matrix", async () => {
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

  it("renders only the business card matrix", async () => {
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

  it("renders custom KPI cards with value and subtitle", async () => {
    listCustomKPIs.mockResolvedValue({
      ok: true,
      kpis: [makeEvaluatedKPI()],
    });

    render(
      <SummaryCards summary={salariedSummary} hasTransactions incomeType="salaried" />
    );

    expect(await screen.findByText("My Metric")).toBeInTheDocument();
    expect(screen.getByText("this month")).toBeInTheDocument();

    const kpiValue = screen.getByText(/250/);
    expect(kpiValue).toBeInTheDocument();
  });

  it("renders no KPI cards when there are no KPIs", async () => {
    render(
      <SummaryCards summary={salariedSummary} hasTransactions incomeType="salaried" />
    );

    expect(await screen.findByText("Net Balance")).toBeInTheDocument();
    expect(screen.queryByText("My Metric")).not.toBeInTheDocument();
    expect(screen.queryByText(/add a 1-click preset/i)).not.toBeInTheDocument();
  });

  it("pre-fills the edit modal with the selected KPI", async () => {
    listCustomKPIs.mockResolvedValue({
      ok: true,
      kpis: [makeEvaluatedKPI()],
    });

    render(
      <SummaryCards summary={salariedSummary} hasTransactions incomeType="salaried" />
    );

    const editButton = await screen.findByRole("button", {
      name: /edit my metric/i,
    });
    fireEvent.click(editButton);

    const titleInput = screen.getByPlaceholderText(
      "e.g. Groceries this month"
    ) as HTMLInputElement;
    expect(titleInput.value).toBe("My Metric");
    expect(screen.getByRole("heading", { name: "Edit KPI" })).toBeInTheDocument();
  });

  it("deletes a KPI and reloads the list", async () => {
    listCustomKPIs
      .mockResolvedValueOnce({
        ok: true,
        kpis: [makeEvaluatedKPI()],
      })
      .mockResolvedValueOnce({ ok: true, kpis: [] });
    deleteCustomKPI.mockResolvedValue({ ok: true });

    render(
      <SummaryCards summary={salariedSummary} hasTransactions incomeType="salaried" />
    );

    const deleteButton = await screen.findByRole("button", {
      name: /delete my metric/i,
    });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(deleteCustomKPI).toHaveBeenCalledWith("kpi-1");
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /delete my metric/i })
      ).not.toBeInTheDocument();
    });
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

  it("shows the empty-state hint only when there are no transactions", async () => {
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