import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import IncomeProfilePicker from "@/components/IncomeProfilePicker";
import { INCOME_TYPES } from "@/lib/profiles";

const updateIncomeProfile = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/profiles", () => ({
  updateIncomeProfile: (...args: unknown[]) => updateIncomeProfile(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("IncomeProfilePicker", () => {
  it("renders all four income types", () => {
    render(<IncomeProfilePicker />);

    for (const type of INCOME_TYPES) {
      expect(
        screen.getByRole("radio", { name: new RegExp(type, "i") })
      ).toBeInTheDocument();
    }
  });

  it("submits the selected income type and refreshes the route", async () => {
    updateIncomeProfile.mockResolvedValue({ ok: true });

    render(<IncomeProfilePicker initialIncomeType="hourly" />);

    fireEvent.click(screen.getByRole("radio", { name: /freelancer/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /save income profile/i })
    );

    await waitFor(() => {
      expect(updateIncomeProfile).toHaveBeenCalledWith("freelancer", {});
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("submits payday and expected income for pay-cycle income types", async () => {
    updateIncomeProfile.mockResolvedValue({ ok: true });

    render(<IncomeProfilePicker />);

    fireEvent.click(screen.getByRole("radio", { name: /salaried/i }));
    fireEvent.change(
      screen.getByLabelText(/payday/i),
      { target: { value: "28" } }
    );
    fireEvent.change(
      screen.getByLabelText(/expected income per pay period/i),
      { target: { value: "5000" } }
    );
    fireEvent.click(
      screen.getByRole("button", { name: /save income profile/i })
    );

    await waitFor(() => {
      expect(updateIncomeProfile).toHaveBeenCalledWith("salaried", {
        payday: 28,
        expected_income: 5000,
      });
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("does not clear payday/expected_income when the fields are left blank", async () => {
    updateIncomeProfile.mockResolvedValue({ ok: true });

    render(
      <IncomeProfilePicker
        initialIncomeType="salaried"
        initialPayday={15}
        initialExpectedIncome={4000}
      />
    );

    expect(screen.getByLabelText(/payday/i)).toHaveValue(15);

    fireEvent.change(screen.getByLabelText(/payday/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText(/expected income per pay period/i), {
      target: { value: "" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /save income profile/i })
    );

    await waitFor(() => {
      expect(updateIncomeProfile).toHaveBeenCalledWith("salaried", {});
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("omits payday/expected_income for freelancer and business types", async () => {
    updateIncomeProfile.mockResolvedValue({ ok: true });

    render(
      <IncomeProfilePicker initialIncomeType="salaried" initialPayday={15} />
    );

    fireEvent.click(screen.getByRole("radio", { name: /business/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /save income profile/i })
    );

    await waitFor(() => {
      expect(updateIncomeProfile).toHaveBeenCalledWith("business", {});
    });
  });
});