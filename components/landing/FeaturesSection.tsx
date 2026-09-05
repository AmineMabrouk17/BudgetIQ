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

const popClasses: Record<string, string> = {
  green: "text-pop-green",
  orange: "text-pop-orange",
  purple: "text-pop-purple",
  pink: "text-pop-pink",
  yellow: "text-pop-yellow",
  red: "text-pop-red",
};

interface FeatureCardData {
  icon: LucideIcon;
  color: keyof typeof popClasses;
  title: string;
  description: string;
}

const featureCards: FeatureCardData[] = [
  {
    icon: Receipt,
    color: "green",
    title: "Track it all in one place",
    description:
      "Income, expenses, and assets live together in a single view — salary, bills, subscriptions, cash, and investments.",
  },
  {
    icon: MessageSquare,
    color: "orange",
    title: "Log transactions by typing",
    description:
      'Just say "I spent $15 on coffee" and the AI assistant records it for you — no forms, no spreadsheets.',
  },
  {
    icon: Gauge,
    color: "purple",
    title: "Know your numbers in real time",
    description:
      "Net balance, monthly spend, and total assets update the moment you add a transaction.",
  },
  {
    icon: ChartPie,
    color: "pink",
    title: "See where your money goes",
    description:
      "Interactive category breakdowns and charts turn your habits into something you can act on.",
  },
  {
    icon: LayoutDashboard,
    color: "yellow",
    title: "Custom KPI cards that fit your life",
    description:
      "Net balance, savings rate, profit, and runway — tailored cards for salaried, freelance, and business finances.",
  },
  {
    icon: LogIn,
    color: "red",
    title: "One-click sign-in, open source",
    description:
      "Sign in with Google in seconds — and since BudgetIQ is open source under MIT, you can inspect every line.",
  },
];

function FeatureCard({ icon: Icon, color, title, description }: FeatureCardData) {
  return (
    <div className="group h-full rounded-2xl border border-white/[0.08] bg-night-raised p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.55)] motion-reduce:hover:transform-none motion-reduce:transition-none">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition-transform duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100">
        <Icon className={`h-6 w-6 ${popClasses[color]}`} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-display font-semibold tracking-[-0.02em] text-white/90">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-[1.6] text-muted">{description}</p>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-night py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to take control of your money"
          description="A complete money tracker with an AI assistant that does the data entry for you — free and open source."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card, index) => (
            <Reveal
              key={card.title}
              variant="up"
              delay={index * 90}
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
