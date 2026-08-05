import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profiles";
import { landingView } from "@/lib/landing-view";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FaqSection from "@/components/landing/FaqSection";
import CtaBand from "@/components/landing/CtaBand";
import LandingFooter from "@/components/landing/LandingFooter";

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
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
