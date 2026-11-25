import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Most suites run in jsdom, but a few exercise Node-only request parsing with
// `// @vitest-environment node`; their environment has no window to patch.
const hasDom = typeof window !== "undefined" && typeof document !== "undefined";

if (hasDom) {
  afterEach(() => {
    cleanup();
  });
}

export function createMatchMedia(queries: Record<string, boolean> = {}) {
  return (query: string) => ({
    matches: Boolean(queries[query]),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (hasDom) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: createMatchMedia(),
  });
}

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
