import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LandingHero from "@/components/landing/LandingHero";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
    width,
    height,
  }: {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- plain img stands in for next/image in jsdom
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
    />
  ),
}));

describe("LandingHero", () => {
  it("renders the value proposition and call-to-action", () => {
    render(<LandingHero />);

    expect(
      screen.getByText(/track income, expenses, and assets/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get Started" })).toBeInTheDocument();
  });
});
