import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import CtaBand from "@/components/landing/CtaBand";

describe("CtaBand", () => {
  it("renders the headline, primary CTA, and trust line", () => {
    render(<CtaBand />);

    expect(
      screen.getByRole("heading", {
        name: /start tracking your money in minutes/i,
      })
    ).toBeInTheDocument();

    const getStarted = screen.getByRole("link", {
      name: /get started/i,
    });
    expect(getStarted).toBeInTheDocument();
    expect(getStarted).toHaveAttribute("href", "/login");

    expect(
      screen.getByText(/free forever · no credit card · open source/i)
    ).toBeInTheDocument();
  });
});
