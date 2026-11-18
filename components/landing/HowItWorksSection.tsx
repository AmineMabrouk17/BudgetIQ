import SectionHeading from "@/components/landing/SectionHeading";
import Reveal from "@/components/landing/Reveal";

interface StepData {
  number: string;
  title: string;
  description: string;
}

const steps: StepData[] = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Sign in with Google in seconds. No credit card, no setup, no download.",
  },
  {
    number: "02",
    title: "Add transactions your way",
    description:
      'Type "I spent $15 on coffee" and the AI assistant logs it, or add income, expenses, and assets manually.',
  },
  {
    number: "03",
    title: "See the bigger picture",
    description:
      "Watch your net balance, monthly expenses, and total assets add up, with category charts along the way.",
  },
];

function StepCard({ number, title, description }: StepData) {
  return (
    <div className="h-full">
      <span className="ledger-num font-display text-5xl font-normal leading-none tracking-[-0.03em] text-clay">
        {number}
      </span>
      <h3 className="mt-5 font-display text-xl font-normal tracking-[-0.02em] text-ink">
        {title}
      </h3>
      <p className="mt-2 text-pretty text-sm leading-[1.65] text-ink-soft">{description}</p>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-b border-rule bg-surface py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="How it works"
          title="Tracking your money in three steps"
          description="From sign-up to your first logged transaction in under a minute."
        />
        <ol className="mt-12 grid list-none gap-10 md:grid-cols-3 md:gap-0">
          {steps.map((step, index) => (
            <li
              key={step.number}
              className={`h-full md:border-l md:border-rule md:pl-8 ${
                index === 0 ? "md:border-l-0 md:pl-0" : ""
              }`}
            >
              <Reveal variant="up" delay={index * 90} className="h-full">
                <StepCard {...step} />
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
