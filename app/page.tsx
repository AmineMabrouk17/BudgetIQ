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
import Reveal from "@/components/landing/Reveal";

export default async function Home() {
  const profile = await getProfile();

  if (landingView(profile) === "dashboard") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-base-200">
      <LandingNav />
      <main>
        <Reveal>
          <LandingHero />
        </Reveal>
        <Reveal>
          <FeaturesSection />
        </Reveal>
        <Reveal>
          <HowItWorksSection />
        </Reveal>
        <Reveal>
          <TestimonialsSection />
        </Reveal>
        <Reveal>
          <FaqSection />
        </Reveal>
        <Reveal>
          <CtaBand />
        </Reveal>
      </main>
      <LandingFooter />
    </div>
  );
}
