import SectionHeading from "@/components/landing/SectionHeading";
import Reveal from "@/components/landing/Reveal";

interface StepData {
  number: string;
  title: string;
  description: string;
  colorClass: string;
}

const steps: StepData[] = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Sign in with Google in seconds. No credit card, no setup, no download.",
    colorClass: "text-pop-green",
  },
  {
    number: "02",
    title: "Add transactions your way",
    description:
      'Type "I spent $15 on coffee" and the AI assistant logs it — or add income, expenses, and assets manually.',
    colorClass: "text-pop-yellow",
  },
  {
    number: "03",
    title: "See the bigger picture",
    description:
      "Watch your net balance, monthly spend, and total assets add up, with category charts along the way.",
    colorClass: "text-pop-purple",
  },
];

function StepCard({ number, title, description, colorClass }: StepData) {
  return (
    <div className="group h-full rounded-2xl border border-white/[0.08] bg-night-raised p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.55)] motion-reduce:hover:transform-none motion-reduce:transition-none">
      <span
        className={`text-4xl font-bold ${colorClass} transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0`}
      >
        {number}
      </span>
      <h3 className="mt-3 text-lg font-display font-semibold tracking-[-0.02em] text-white/90">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-[1.6] text-muted">{description}</p>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-night-alt py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="How it works"
          title="Tracking your money in three steps"
          description="From sign-up to your first logged transaction in under a minute."
        />
        <ol className="mt-12 grid list-none gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.number} className="h-full">
              <Reveal variant="up" delay={index * 110} className="h-full">
                <StepCard {...step} />
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
