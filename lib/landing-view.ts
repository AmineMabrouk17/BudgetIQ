import type { Profile } from "@/lib/profiles";

export type LandingView = "dashboard" | "landing";

export function landingView(profile: Profile | null): LandingView {
  return profile ? "dashboard" : "landing";
}
