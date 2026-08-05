import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import HowItWorksSection from "@/components/landing/HowItWorksSection";

describe("HowItWorksSection", () => {
  it("renders the section heading", () => {
    render(<HowItWorksSection />);

    expect(
      screen.getByRole("heading", {
        name: /tracking your money in three steps/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the three steps", () => {
    render(<HowItWorksSection />);

    const steps = [
      "Create your account",
      "Add transactions your way",
      "See the bigger picture",
    ];

    for (const step of steps) {
      expect(
        screen.getByRole("heading", { name: new RegExp(step, "i") })
      ).toBeInTheDocument();
    }
  });
});
