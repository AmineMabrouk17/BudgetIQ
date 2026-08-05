import type { LucideIcon } from "lucide-react";
import {
  ChartPie,
  Gauge,
  LogIn,
  MessageSquare,
  Quote,
  Receipt,
} from "lucide-react";
import SectionHeading from "@/components/landing/SectionHeading";

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
      "Income, expenses, and assets live together in a single view — salary, bills, subscriptions, cash, and investments.",
  },
  {
    icon: MessageSquare,
    title: "Log transactions by typing",
    description:
      'Just say "I spent $15 on coffee" and the AI assistant records it for you — no forms, no spreadsheets.',
  },
  {
    icon: Gauge,
    title: "Know your numbers in real time",
    description:
      "Net balance, monthly spend, and total assets update the moment you add a transaction.",
  },
  {
    icon: ChartPie,
    title: "See where your money goes",
    description:
      "Interactive category breakdowns and charts turn your habits into something you can act on.",
  },
  {
    icon: Quote,
    title: "A fresh quote every day",
    description:
      "Daily financial quotes keep you grounded and motivated, right inside the app.",
  },
  {
    icon: LogIn,
    title: "One-click sign-in, open source",
    description:
      "Sign in with Google in seconds — and since BudgetIQ is open source under MIT, you can inspect every line.",
  },
];

function FeatureCard({ icon: Icon, title, description }: FeatureCardData) {
  return (
    <div className="rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-base-content/70">
        {description}
      </p>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-base-100 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to take control of your money"
          description="A complete money tracker with an AI assistant that does the data entry for you — free and open source."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
