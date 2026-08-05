import { describe, expect, it } from "vitest";
import { metadata } from "@/app/metadata";

describe("landing page metadata", () => {
  it("uses the updated title and description", () => {
    expect(metadata.title).toMatch(/your money, finally under control/i);
    expect(metadata.description).toMatch(/income, expenses, and assets/i);
    expect(metadata.description).not.toMatch(/budget planner|coming soon/i);
  });

  it("sets an Open Graph image reusing the vertical logo asset", () => {
    const image = Array.isArray(metadata.openGraph?.images)
      ? metadata.openGraph?.images[0]
      : undefined;

    expect(image).toBeDefined();
    if (typeof image === "object" && image && "url" in image) {
      expect(image.url).toContain("logo-vertical");
    }
  });
});
