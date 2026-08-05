import { describe, expect, it } from "vitest";
import { landingView } from "@/lib/landing-view";
import type { Profile } from "@/lib/profiles";

describe("landingView", () => {
  it("routes anonymous visitors to the landing page", () => {
    expect(landingView(null)).toBe("landing");
  });

  it("routes signed-in users straight to the dashboard", () => {
    const profile: Profile = {
      id: "user-1",
      email: "ada@example.com",
      full_name: "Ada Lovelace",
      avatar_url: null,
    };

    expect(landingView(profile)).toBe("dashboard");
  });
});
