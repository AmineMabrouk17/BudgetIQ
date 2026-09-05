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
      expect(updateIncomeProfile).toHaveBeenCalledWith("freelancer");
    });
    expect(refresh).toHaveBeenCalled();
  });
});