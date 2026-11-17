import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TransactionTable from "@/components/dashboard/TransactionTable";
import type { Transaction } from "@/types/transaction";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/actions/transactions", () => ({
  deleteTransaction: vi.fn(),
  loadMoreTransactions: vi.fn(),
}));

vi.mock("@/lib/currency/use-display-currency", () => ({
  useCurrencyFormatter: () => (amount: number) => `$${amount.toFixed(2)}`,
}));

function transaction(id: string, title: string, amount: number): Transaction {
  return {
    id,
    user_id: "user-1",
    type: "expense",
    title,
    amount,
    category: "Food",
    created_at: "2026-08-01T12:00:00.000Z",
    scope: "personal",
  };
}

const initial = [transaction("t1", "Coffee", 12.5)];

describe("TransactionTable accessibility and state sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes sortable headers as buttons with live aria-sort state", () => {
    render(
      <TransactionTable
        transactions={initial}
        nextCursor={null}
        scope={null}
      />
    );

    const amountHeader = screen.getByRole("columnheader", { name: /amount/i });
    expect(amountHeader).toHaveAttribute("aria-sort", "none");

    const amountButton = screen.getByRole("button", { name: /amount/i });
    fireEvent.click(amountButton);

    expect(amountHeader).toHaveAttribute("aria-sort", "ascending");

    fireEvent.click(amountButton);
    expect(amountHeader).toHaveAttribute("aria-sort", "descending");
  });

  it("labels the transaction-only scope group", () => {
    render(
      <TransactionTable
        transactions={initial}
        nextCursor={null}
        scope={null}
      />
    );

    expect(
      screen.getByRole("group", { name: "Transaction scope" })
    ).toBeTruthy();
    expect(screen.getByText(/applies to transactions only/i)).toBeTruthy();
  });

  it("renders the rows supplied by its server payload", () => {
    render(
      <TransactionTable
        transactions={[...initial, transaction("t2", "Groceries", 45)]}
        nextCursor={null}
        scope={null}
      />
    );

    expect(screen.getByText("Coffee")).toBeTruthy();
    expect(screen.getByText("Groceries")).toBeTruthy();
  });
});
