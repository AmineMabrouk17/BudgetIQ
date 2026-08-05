import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingHero from "@/components/landing/LandingHero";

describe("LandingHero", () => {
  it("renders the headline, both call-to-actions, and trust strip", () => {
    render(<LandingHero />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /your money, finally under control/i,
      })
    ).toBeInTheDocument();

    const getStarted = screen.getByRole("link", {
      name: /get started free/i,
    });
    expect(getStarted).toBeInTheDocument();
    expect(getStarted).toHaveAttribute("href", "/login");

    const viewOnGithub = screen.getByRole("link", {
      name: /view on github/i,
    });
    expect(viewOnGithub).toBeInTheDocument();
    expect(viewOnGithub).toHaveAttribute(
      "href",
      "https://github.com/AmineMabrouk17/BudgetIQ"
    );

    expect(
      screen.getByText(/free forever · open source · no ads · your data, yours/i)
    ).toBeInTheDocument();
  });
});
