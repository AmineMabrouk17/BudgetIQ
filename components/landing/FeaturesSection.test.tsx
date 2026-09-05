import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FeaturesSection from "@/components/landing/FeaturesSection";

describe("FeaturesSection", () => {
  it("renders the section heading", () => {
    render(<FeaturesSection />);

    expect(
      screen.getByRole("heading", {
        name: /everything you need to take control of your money/i,
      })
    ).toBeInTheDocument();
  });

  it("renders all six feature cards", () => {
    render(<FeaturesSection />);

    const titles = [
      "Track it all in one place",
      "Log transactions by typing",
      "Know your numbers in real time",
      "See where your money goes",
      "Custom KPI cards that fit your life",
      "One-click sign-in, open source",
    ];

    for (const title of titles) {
      expect(
        screen.getByRole("heading", { name: new RegExp(title, "i") })
      ).toBeInTheDocument();
    }
  });

  it("shows the AI natural-language logging example", () => {
    render(<FeaturesSection />);

    expect(
      screen.getByText(/i spent \$15 on coffee/i)
    ).toBeInTheDocument();
  });
});
