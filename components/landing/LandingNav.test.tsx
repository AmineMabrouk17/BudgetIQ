import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingNav from "@/components/landing/LandingNav";

describe("LandingNav", () => {
  it("renders the logo, section anchors, and sign-in actions", () => {
    render(<LandingNav />);

    expect(
      screen.getByRole("link", { name: /budgetiq/i })
    ).toBeInTheDocument();

    for (const anchor of ["Features", "How it works", "FAQ"]) {
      expect(screen.getByRole("link", { name: anchor })).toBeInTheDocument();
    }

    const logIn = screen.getByRole("link", { name: /log in/i });
    expect(logIn).toBeInTheDocument();
    expect(logIn).toHaveAttribute("href", "/login");

    const getStarted = screen.getByRole("link", { name: /get started/i });
    expect(getStarted).toBeInTheDocument();
    expect(getStarted).toHaveAttribute("href", "/login");
  });
});
