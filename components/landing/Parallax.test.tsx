import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Parallax from "@/components/landing/Parallax";

describe("Parallax", () => {
  it("renders children inside a translated wrapper", () => {
    render(
      <Parallax speed={0.2} className="test-class">
        <div>Glow layer</div>
      </Parallax>
    );

    const inner = screen.getByText("Glow layer");
    const wrapper = inner.parentElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveClass("test-class");
  });
});
