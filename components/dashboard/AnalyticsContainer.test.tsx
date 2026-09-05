import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AnalyticsContainer from "@/components/dashboard/AnalyticsContainer";
import type { Transaction } from "@/types/transaction";

vi.mock("@/components/dashboard/CashFlowChart", () => ({
  default: () => <div data-testid="cashflow-chart" />,
}));

vi.mock("@/components/dashboard/SpendingTrajectoryChart", () => ({
  default: () => <div data-testid="trajectory-chart" />,
}));

vi.mock("@/components/dashboard/CategoryChart", () => ({
  default: () => <div data-testid="category-chart" />,
}));

vi.mock("@/lib/currency/use-display-currency", () => ({
  useCurrencyFormatter: () => (amount: number) => `$${amount.toFixed(2)}`,
}));

function makeTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: "txn-1",
    user_id: "user-1",
    type: "expense",
    title: "Coffee",
    amount: 12.5,
    category: "Food",
    created_at: "2026-08-01T12:00:00.000Z",
    scope: "personal",
    ...overrides,
  };
}

const transactions: Transaction[] = [
  makeTransaction({ id: "t1", type: "expense", category: "Food", amount: 40 }),
  makeTransaction({
    id: "t2",
    type: "expense",
    category: "Rent",
    amount: 1200,
  }),
];

describe("AnalyticsContainer", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders the cash flow view by default", () => {
    render(<AnalyticsContainer transactions={transactions} />);
    expect(screen.getByTestId("cashflow-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("trajectory-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("category-chart")).not.toBeInTheDocument();
  });

  it("switches between the three views with the segmented control", () => {
    render(<AnalyticsContainer transactions={transactions} />);

    fireEvent.click(screen.getByRole("button", { name: /spending trajectory/i }));
    expect(screen.getByTestId("trajectory-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("cashflow-chart")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /category breakdown/i }));
    expect(screen.getByTestId("category-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("trajectory-chart")).not.toBeInTheDocument();
  });

  it("persists the selected tab for the session", () => {
    const { unmount } = render(<AnalyticsContainer transactions={transactions} />);

    fireEvent.click(screen.getByRole("button", { name: /category breakdown/i }));
    expect(sessionStorage.getItem("analytics-tab")).toBe("categories");

    unmount();

    render(<AnalyticsContainer transactions={transactions} />);
    expect(screen.getByTestId("category-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("cashflow-chart")).not.toBeInTheDocument();
  });

  it("toggles between donut and ranked category views", () => {
    render(<AnalyticsContainer transactions={transactions} />);

    fireEvent.click(screen.getByRole("button", { name: /category breakdown/i }));
    expect(screen.getByTestId("category-chart")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ranked/i }));
    expect(screen.queryByTestId("category-chart")).not.toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("$1200.00")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("$40.00")).toBeInTheDocument();
  });

  it("ranks categories by amount descending", () => {
    render(<AnalyticsContainer transactions={transactions} />);

    fireEvent.click(screen.getByRole("button", { name: /category breakdown/i }));
    fireEvent.click(screen.getByRole("button", { name: /ranked/i }));

    const items = screen.getAllByRole("list").flatMap((list) =>
      Array.from(list.querySelectorAll("li")).map((li) => li.textContent ?? "")
    );
    const rentIndex = items.findIndex((text) => text.includes("Rent"));
    const foodIndex = items.findIndex((text) => text.includes("Food"));
    expect(rentIndex).toBeGreaterThan(-1);
    expect(foodIndex).toBeGreaterThan(-1);
    expect(rentIndex).toBeLessThan(foodIndex);
  });
});