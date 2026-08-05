import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profiles";
import { landingView } from "@/lib/landing-view";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";

export default async function Home() {
  const profile = await getProfile();

  if (landingView(profile) === "dashboard") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-base-200">
      <LandingNav />
      <main>
        <LandingHero />
      </main>
    </div>
  );
}
