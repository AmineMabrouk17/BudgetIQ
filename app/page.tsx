import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import AnnouncementBar from "@/components/landing/AnnouncementBar";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ProofSection from "@/components/landing/ProofSection";
import FaqSection from "@/components/landing/FaqSection";
import CtaBand from "@/components/landing/CtaBand";
import LandingFooter from "@/components/landing/LandingFooter";

export default async function Home() {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-canvas text-ink antialiased">
      <a
        href="#main"
        className="sr-only rounded-none focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-canvas"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <LandingNav />
      <main id="main">
        <LandingHero />
        <FeaturesSection />
        <HowItWorksSection />
        <ProofSection />
        <FaqSection />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
