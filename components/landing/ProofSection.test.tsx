import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProofSection from "@/components/landing/ProofSection";

describe("ProofSection", () => {
  it("renders the section heading", () => {
    render(<ProofSection />);

    expect(
      screen.getByRole("heading", { name: /open source is the trust model/i })
    ).toBeInTheDocument();
  });

  it("renders the three verifiable proofs", () => {
    render(<ProofSection />);

    for (const title of [
      "Row-level security",
      "MIT licensed",
      "Self-host it",
    ]) {
      expect(
        screen.getByRole("heading", { name: new RegExp(title, "i") })
      ).toBeInTheDocument();
    }
  });

  it("is honest that testimonials are not published yet", () => {
    render(<ProofSection />);

    expect(
      screen.getByText(/no testimonials yet/i)
    ).toBeInTheDocument();
  });
});
