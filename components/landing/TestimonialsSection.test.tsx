import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TestimonialsSection from "@/components/landing/TestimonialsSection";

describe("TestimonialsSection", () => {
  it("presents verifiable reasons instead of fabricated testimonials", () => {
    render(<TestimonialsSection />);

    expect(screen.getByText(/why people choose budgetiq/i)).toBeInTheDocument();

    const facts = [
      /free and open source/i,
      /private by default/i,
      /no ads, no upsell/i,
      /log it by describing it/i,
    ];

    for (const fact of facts) {
      expect(screen.getByText(fact)).toBeInTheDocument();
    }

    expect(screen.queryByText(/real quotes coming soon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sarah m\./i)).not.toBeInTheDocument();
    expect(screen.queryAllByRole("blockquote")).toHaveLength(0);
  });
});
