import type { LucideIcon } from "lucide-react";
import {
  ChartPie,
  Gauge,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Receipt,
} from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import SectionIntro from "@/components/landing/SectionIntro";

interface FeatureData {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: FeatureData[] = [
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

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-b border-rule bg-canvas py-24 lg:py-28"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal variant="up">
          <div className="grid gap-6 lg:grid-cols-12">
            <SectionIntro
              title="Everything you need to take control of your money"
              description="A complete money tracker with an AI assistant that handles the data entry. Free and open source."
              titleClassName="lg:col-span-7"
              descriptionClassName="lg:col-span-4 lg:col-start-9"
            />
          </div>
        </Reveal>

        <div className="mt-14 grid border-t border-rule-strong md:grid-cols-2">
          {features.map(({ icon: Icon, title, description }, index) => (
            <Reveal
              key={title}
              variant="up"
              delay={index * 60}
              className={`border-b border-rule ${
                index % 2 === 1
                  ? "md:border-l md:border-rule md:pl-8"
                  : "md:pr-8"
              }`}
            >
              <article className="group flex h-full gap-4 py-8">
                <Icon
                  className="mt-0.5 h-5 w-5 shrink-0 text-signal transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-display text-[1.15rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-[42ch] text-pretty text-[15px] leading-[1.6] text-ink-soft">
                    {description}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
