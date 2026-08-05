import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TestimonialsSection from "@/components/landing/TestimonialsSection";

describe("TestimonialsSection", () => {
  it("renders three placeholder testimonials", () => {
    render(<TestimonialsSection />);

    const quotes = [
      /the AI assistant is the reason i stayed/i,
      /net balance and total assets without juggling/i,
      /my data stays mine/i,
    ];

    for (const quote of quotes) {
      expect(screen.getByText(quote)).toBeInTheDocument();
    }

    expect(
      screen.getAllByRole("blockquote", { hidden: false })
    ).toHaveLength(3);
  });
});
