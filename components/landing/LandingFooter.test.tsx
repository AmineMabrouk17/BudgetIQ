import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingFooter from "@/components/landing/LandingFooter";

describe("LandingFooter", () => {
  it("renders the license line, product anchors, and GitHub link", () => {
    render(<LandingFooter />);

    expect(
      screen.getByText(/budgetiq · open source under mit/i)
    ).toBeInTheDocument();

    for (const anchor of [
      "Features",
      "How it works",
      "Testimonials",
      "FAQ",
    ]) {
      expect(
        screen.getByRole("link", { name: anchor })
      ).toBeInTheDocument();
    }

    const github = screen.getByRole("link", { name: /github/i });
    expect(github).toHaveAttribute(
      "href",
      "https://github.com/AmineMabrouk17/BudgetIQ"
    );
  });

  it("does not link to privacy or terms pages", () => {
    render(<LandingFooter />);

    expect(
      screen.queryByRole("link", { name: /privacy/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /terms/i })
    ).not.toBeInTheDocument();
  });
});
