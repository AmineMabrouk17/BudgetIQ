import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

  it("discloses the section links on small screens and closes on Escape", () => {
    render(<LandingNav />);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveAttribute("aria-controls", "mobile-section-nav");

    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");

    const mobileNav = document.getElementById("mobile-section-nav");
    expect(mobileNav).not.toHaveAttribute("hidden");
    for (const anchor of ["Features", "How it works", "FAQ"]) {
      expect(
        screen.getAllByRole("link", { name: anchor }).length
      ).toBeGreaterThan(1);
    }

    fireEvent.keyDown(window, { key: "Escape" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(mobileNav).toHaveAttribute("hidden");
    expect(menuButton).toHaveFocus();
  });

  it("closes the disclosure when a section link is activated", () => {
    render(<LandingNav />);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(menuButton);

    const faqLinks = screen.getAllByRole("link", { name: "FAQ" });
    fireEvent.click(faqLinks[faqLinks.length - 1]);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();
  });
});
