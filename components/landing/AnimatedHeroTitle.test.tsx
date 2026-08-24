import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AnimatedHeroTitle from "@/components/landing/AnimatedHeroTitle";

describe("AnimatedHeroTitle", () => {
  it("renders both headline lines inside a single accessible h1", () => {
    render(
      <AnimatedHeroTitle lines={["Your money,", "finally under control."]} />
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /your money, finally under control/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText("Your")).toBeInTheDocument();
    expect(screen.getByText("money,")).toBeInTheDocument();
    expect(screen.getByText("finally")).toBeInTheDocument();
    expect(screen.getByText("under")).toBeInTheDocument();
    expect(screen.getByText("control.")).toBeInTheDocument();
  });
});
