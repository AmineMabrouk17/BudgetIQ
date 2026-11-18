import type { LucideIcon } from "lucide-react";
import {
  ChartPie,
  Gauge,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Receipt,
} from "lucide-react";
import SectionHeading from "@/components/landing/SectionHeading";
import Reveal from "@/components/landing/Reveal";

interface FeatureCardData {
  icon: LucideIcon;
  title: string;
  description: string;
}

const featureCards: FeatureCardData[] = [
  {
    icon: Receipt,
    title: "Track it all in one place",
    description:
      "Income, expenses, and assets in one view: salary, bills, subscriptions, cash, and investments.",
  },
  {
    icon: MessageSquare,
    title: "Log transactions by typing",
    description:
      'Just say "I spent $15 on coffee" and the AI assistant records it for you. No forms, no spreadsheets.',
  },
  {
    icon: Gauge,
    title: "Know your numbers in real time",
    description:
      "Net balance, monthly expenses, and total assets update the moment you add a transaction.",
  },
  {
    icon: ChartPie,
    title: "See where your money goes",
    description:
      "Interactive category breakdowns and charts turn your habits into something you can act on.",
  },
  {
    icon: LayoutDashboard,
    title: "Custom KPI cards that fit your life",
    description:
      "Net balance, savings rate, profit, and runway. Tailored cards for salaried, freelance, and business finances.",
  },
  {
    icon: LogIn,
    title: "One-click sign-in, open source",
    description:
      "Sign in with Google in seconds. BudgetIQ is open source under MIT, so you can inspect every line.",
  },
];

function FeatureCard({ icon: Icon, title, description }: FeatureCardData) {
  return (
    <div className="group h-full border-t border-rule-strong pt-5">
      <Icon
        className="h-5 w-5 text-clay transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0"
        aria-hidden="true"
      />
      <h3 className="mt-4 font-display text-xl font-normal tracking-[-0.02em] text-ink">
        {title}
      </h3>
      <p className="mt-2 text-pretty text-sm leading-[1.65] text-ink-soft">
        {description}
      </p>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 border-b border-rule bg-canvas py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to take control of your money"
          description="A complete money tracker with an AI assistant that handles the data entry. Free and open source."
        />
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card, index) => (
            <Reveal
              key={card.title}
              variant="up"
              delay={index * 70}
              className="h-full"
            >
              <FeatureCard {...card} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
