import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Parallax from "@/components/landing/Parallax";
import { createMatchMedia } from "@/vitest.setup";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockElementMetrics(el: HTMLElement) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    top: 500,
    right: 0,
    bottom: 0,
    left: 0,
    width: 0,
    height: 120,
    toJSON: () => ({}),
    x: 0,
    y: 500,
  } as DOMRect);
}

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

  it("does not force layout while scrolling (getBoundingClientRect only on measure)", () => {
    vi.stubGlobal(
      "matchMedia",
      createMatchMedia({ "(prefers-reduced-motion: reduce)": false })
    );
    vi.stubGlobal("innerHeight", 800);
    vi.stubGlobal("scrollY", 0);

    const raf: { cb: (() => void) | null } = { cb: null };
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
      raf.cb = cb;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    render(
      <Parallax speed={0.1}>
        <div>Glow layer</div>
      </Parallax>
    );

    const wrapper = screen.getByText("Glow layer").parentElement as HTMLElement;
    const getBoundingClientRect = vi.spyOn(wrapper, "getBoundingClientRect");
    mockElementMetrics(wrapper);
    getBoundingClientRect.mockClear();

    window.dispatchEvent(new Event("scroll"));
    expect(raf.cb).not.toBeNull();
    raf.cb?.();

    expect(getBoundingClientRect).not.toHaveBeenCalled();
    expect(wrapper.style.transform).toMatch(/^translate3d\(0, -/);
  });
});
