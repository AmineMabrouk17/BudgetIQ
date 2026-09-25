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

  describe("advisor replies", () => {
    const withReply = (text: string): SalaryPlan => ({
      ...initialPlan,
      chat_messages: [
        { id: "m1", role: "assistant", text, timestamp: "2026-01-01T00:00:00.000Z" },
      ],
    });

    it("renders the advisor's markdown as formatting, not as literal asterisks", () => {
      render(
        <SalaryPlannerView
          initialPlan={withReply(
            "Your salary is **$1,700**.\n\n- **Essentials:** $1,010\n- **Lifestyle:** $60"
          )}
        />
      );

      const bubble = screen.getByText(/Your salary is/).closest("div")!;
      // The bold run becomes a <strong>, so no raw ** survives anywhere.
      expect(bubble.querySelector("strong")).not.toBeNull();
      expect(bubble.textContent).not.toContain("**");
      // Each bullet becomes a list item, so the literal "- " prefix is gone.
      expect(bubble.querySelectorAll("li")).toHaveLength(2);
      expect(bubble.textContent).not.toContain("- **");
    });

    it("does not execute markup smuggled through a reply", () => {
      render(
        <SalaryPlannerView
          initialPlan={withReply('<img src=x onerror="window.__pwned = true">')}
        />
      );

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined();
    });
  });

  it("invites the user to set a salary instead of showing a wall of zeros", () => {
    render(
      <SalaryPlannerView
        initialPlan={{ ...initialPlan, monthly_salary: 0, actual_essentials: 1010, actual_lifestyle: 60 }}
      />
    );

    // Distinct from the hero copy, which also says "set your monthly salary".
    expect(screen.getByText(/add your salary to see targets/i)).toBeInTheDocument();
  });

  it("does not name a single provider in the advisor heading", () => {
    render(<SalaryPlannerView initialPlan={initialPlan} />);

    const heading = screen.getByRole("heading", { name: /AI Financial Advisor/i });
    expect(heading.textContent).not.toMatch(/gemini|openrouter/i);
  });
});