import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FaqSection from "@/components/landing/FaqSection";

describe("FaqSection", () => {
  it("renders the section heading", () => {
    render(<FaqSection />);

    expect(
      screen.getByRole("heading", { name: /questions, answered/i })
    ).toBeInTheDocument();
  });

  it("renders all six questions", () => {
    render(<FaqSection />);

    const questions = [
      /is budgetiq really free/i,
      /is my financial data private/i,
      /what does the ai assistant do with my data/i,
      /is there a budget feature/i,
      /which devices does budgetiq support/i,
      /different from other finance apps/i,
    ];

    for (const question of questions) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
  });

  it("answers honestly that BudgetIQ does not set or enforce budgets", () => {
    render(<FaqSection />);

    expect(
      screen.getByText(
        /budgetiq tracks income, expenses, and assets\. it doesn't set or enforce budgets/i
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/on the roadmap/i)).not.toBeInTheDocument();
  });
});
