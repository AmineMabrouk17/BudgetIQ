import SectionHeading from "@/components/landing/SectionHeading";

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
      'Type "I spent $15 on coffee" and the AI assistant logs it — or add income, expenses, and assets manually.',
  },
  {
    number: "03",
    title: "See the bigger picture",
    description:
      "Watch your net balance, monthly spend, and total assets add up, with category charts along the way.",
  },
];

function StepCard({ number, title, description }: StepData) {
  return (
    <li className="rounded-2xl border border-base-300/60 bg-base-100 p-6">
      <span className="text-4xl font-bold text-primary/30">{number}</span>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-base-content/70">
        {description}
      </p>
    </li>
  );
}

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-base-200 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="How it works"
          title="Tracking your money in three steps"
          description="From sign-up to your first logged transaction in under a minute."
        />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <StepCard key={step.number} {...step} />
          ))}
        </ol>
      </div>
    </section>
  );
}
