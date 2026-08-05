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

  it("answers honestly that there is no budget feature yet", () => {
    render(<FaqSection />);

    expect(
      screen.getByText(
        /not yet — budgetiq tracks income, expenses, and assets; budgets are on the roadmap/i
      )
    ).toBeInTheDocument();
  });
});
