import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProofSection from "@/components/landing/ProofSection";

describe("ProofSection", () => {
  it("renders the section heading", () => {
    render(<ProofSection />);

    expect(
      screen.getByRole("heading", { name: /log a transaction the way you say it/i })
    ).toBeInTheDocument();
  });

  it("shows the conversational example", () => {
    render(<ProofSection />);

    expect(screen.getByText(/i spent \$45 on groceries today/i)).toBeInTheDocument();
    expect(screen.getByText(/got it — \$45 expense, groceries/i)).toBeInTheDocument();
    expect(screen.getByText(/log transaction/i)).toBeInTheDocument();
    expect(screen.getByText(/logged\. monthly spending/i)).toBeInTheDocument();
  });

  it("renders the three supporting proofs", () => {
    render(<ProofSection />);

    for (const title of ["One confirmation", "Phone and desktop", "Open source"]) {
      expect(
        screen.getByRole("heading", { name: new RegExp(title, "i") })
      ).toBeInTheDocument();
    }
  });

  it("links to the source repository", () => {
    render(<ProofSection />);

    expect(
      screen.getByRole("link", { name: /read the source/i })
    ).toHaveAttribute("href", expect.stringContaining("github.com"));
  });

  it("is honest that testimonials are not published yet", () => {
    render(<ProofSection />);

    expect(
      screen.getByText(/no testimonials yet/i)
    ).toBeInTheDocument();
  });
});