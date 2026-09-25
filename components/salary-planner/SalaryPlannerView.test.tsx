import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SalaryPlannerView from "@/components/salary-planner/SalaryPlannerView";
import type { SalaryPlan } from "@/types/salary-planner";

const saveSalaryPlanAction = vi.fn();
const clearAdvisorChatAction = vi.fn();

vi.mock("@/app/actions/salary-planner", () => ({
  saveSalaryPlanAction: (...args: unknown[]) => saveSalaryPlanAction(...args),
  clearAdvisorChatAction: (...args: unknown[]) => clearAdvisorChatAction(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const initialPlan: SalaryPlan = {
  monthly_salary: 5000,
  has_dependents: false,
  actual_essentials: 2800,
  actual_lifestyle: 1400,
  actual_emergency_fund: 2000,
  actual_investments: 800,
  chat_messages: [],
  ai_advice: null,
};

describe("SalaryPlannerView", () => {
  it("renders the planner header and the four KPI cards", () => {
    render(<SalaryPlannerView initialPlan={initialPlan} />);

    expect(
      screen.getByRole("heading", { name: /Smart Salary Planner/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/1\. Essentials/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Lifestyle/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Emergency Fund/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Investments & Wealth/i)).toBeInTheDocument();
  });

  it("saves the plan via the server action with the current values", async () => {
    saveSalaryPlanAction.mockResolvedValue({ success: true });

    render(<SalaryPlannerView initialPlan={initialPlan} />);

    fireEvent.click(screen.getByRole("button", { name: /Save Plan/i }));

    await waitFor(() => {
      expect(saveSalaryPlanAction).toHaveBeenCalledWith({
        monthly_salary: 5000,
        has_dependents: false,
        actual_essentials: 2800,
        actual_lifestyle: 1400,
        actual_emergency_fund: 2000,
        actual_investments: 800,
      });
    });
  });

  it("recomputes target percentages when the salary input changes", () => {
    render(<SalaryPlannerView initialPlan={initialPlan} />);

    const salaryInput = screen.getByPlaceholderText(
      "Enter your monthly salary (e.g. 5000)"
    ) as HTMLInputElement;
    expect(salaryInput.value).toBe("5000");

    fireEvent.change(salaryInput, { target: { value: "10000" } });

    const essentialsPct = screen.getByText(/^28\.0%$/);
    const lifestylePct = screen.getByText(/^14\.0%$/);
    expect(essentialsPct).toBeInTheDocument();
    expect(lifestylePct).toBeInTheDocument();
  });
});