import { describe, expect, it, vi } from "vitest";
import { isValidElement } from "react";
import DashboardTransactions from "@/components/dashboard/DashboardTransactions";
import { getTransactionsPage } from "@/lib/transactions";
import type { Transaction } from "@/types/transaction";

vi.mock("@/lib/transactions", () => ({
  getTransactionsPage: vi.fn(),
}));

vi.mock("@/components/dashboard/TransactionTable", () => ({
  default: () => null,
}));

function transaction(id: string): Transaction {
  return {
    id,
    user_id: "user-1",
    type: "expense",
    title: "Coffee",
    amount: 12.5,
    category: "Food",
    created_at: "2026-08-01T12:00:00.000Z",
    scope: "personal",
  };
}

describe("DashboardTransactions", () => {
  it("derives the table key from the server page's row ids", async () => {
    vi.mocked(getTransactionsPage).mockResolvedValue({
      transactions: [transaction("t1"), transaction("t2")],
      nextCursor: null,
    });

    const element = await DashboardTransactions({ scope: null });

    expect(isValidElement(element)).toBe(true);
    expect(isValidElement(element) && element.key).toBe("page-t1|t2");
  });
});
