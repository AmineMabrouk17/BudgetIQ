import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AddTransactionModal from "@/components/dashboard/AddTransactionModal";

const refresh = vi.fn();
const createTransactionMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/actions/transactions", () => ({
  createTransaction: (...args: unknown[]) => createTransactionMock(...args),
}));

vi.mock("@/components/ui/CategoryCombobox", () => ({
  default: () => <input name="category" />,
}));

vi.mock("@/lib/currency/use-display-currency", () => ({
  useDisplayCurrency: () => "USD",
  loadRates: vi.fn(),
}));

HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};

describe("AddTransactionModal save feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTransactionMock.mockResolvedValue({ ok: true });
  });

  it("keeps a live region mounted and fills it after a successful save", async () => {
    render(<AddTransactionModal />);

    fireEvent.click(screen.getByRole("button", { name: /add transaction/i }));

    // The live region itself exists before the message so screen readers
    // announce the text change after the save.
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.queryByText(/transaction added/i)).toBeNull();

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Coffee" },
    });
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "12.50" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Transaction added. Your dashboard is up to date.")
      ).toBeTruthy();
    });
    expect(refresh).toHaveBeenCalledOnce();
  });
});
