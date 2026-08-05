import { act, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import Reveal from "@/components/landing/Reveal";
import { createMatchMedia } from "@/vitest.setup";

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  elements: Set<Element> = new Set();

  constructor(private callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return [];
  }

  trigger(isIntersecting: boolean) {
    this.callback(
      Array.from(this.elements).map(
        (element) =>
          ({ isIntersecting, target: element }) as IntersectionObserverEntry
      ),
      this as unknown as IntersectionObserver
    );
  }
}

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    MockIntersectionObserver as unknown as typeof IntersectionObserver
  );
});

afterEach(() => {
  MockIntersectionObserver.instances = [];
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  it("renders children hidden, then fades in when scrolled into view", () => {
    vi.stubGlobal(
      "matchMedia",
      createMatchMedia({ "(prefers-reduced-motion: reduce)": false })
    );

    render(<Reveal>Revealed content</Reveal>);

    const content = screen.getByText("Revealed content");
    expect(content).toHaveClass("opacity-0");

    const observer = MockIntersectionObserver.instances[0];
    expect(observer.elements.size).toBe(1);

    act(() => observer.trigger(true));

    expect(content).toHaveClass("opacity-100");
  });

  it("renders fully visible and skips the observer when prefers-reduced-motion is set", () => {
    vi.stubGlobal(
      "matchMedia",
      createMatchMedia({ "(prefers-reduced-motion: reduce)": true })
    );

    render(<Reveal>Static content</Reveal>);

    expect(screen.getByText("Static content")).toHaveClass("opacity-100");
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });
});
