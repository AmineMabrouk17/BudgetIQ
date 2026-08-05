import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profiles";
import { landingView } from "@/lib/landing-view";
import LandingHero from "@/components/landing/LandingHero";

export default async function Home() {
  const profile = await getProfile();

  if (landingView(profile) === "dashboard") {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <LandingHero />
    </main>
  );
}
