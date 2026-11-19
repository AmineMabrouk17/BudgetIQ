import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingHero from "@/components/landing/LandingHero";

describe("LandingHero", () => {
  it("renders the headline, both call-to-actions, and trust strip", () => {
    render(<LandingHero />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /say what you spent.*already logged/i,
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
      screen.getByText(/free forever/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/no ads/i)).toBeInTheDocument();
    expect(screen.getByText(/your data, yours/i)).toBeInTheDocument();
  });

  it("renders the live statement card with the assistant exchange", () => {
    render(<LandingHero />);

    expect(screen.getByText(/august statement/i)).toBeInTheDocument();
    expect(screen.getByText(/net balance/i)).toBeInTheDocument();
    expect(screen.getByText(/i spent \$15 on coffee/i)).toBeInTheDocument();
    expect(screen.getByText(/got it/i)).toBeInTheDocument();
  });
});
