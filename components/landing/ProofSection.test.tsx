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

  it("quotes the policy that enforces the privacy claim", () => {
    render(<ProofSection />);

    expect(screen.getByText(/auth\.uid\(\) = user_id/)).toBeInTheDocument();
    expect(
      screen.getByText(/enable row level security/i)
    ).toBeInTheDocument();
  });

  it("cites the migration the quote comes from", () => {
    render(<ProofSection />);

    expect(
      screen.getByRole("link", { name: "0001_transactions.sql" })
    ).toHaveAttribute(
      "href",
      expect.stringContaining("supabase/migrations/0001_transactions.sql")
    );
  });

  it("is honest that testimonials are not published yet", () => {
    render(<ProofSection />);

    expect(
      screen.getByText(/no testimonials yet/i)
    ).toBeInTheDocument();
  });
});
