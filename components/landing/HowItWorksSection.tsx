import Reveal from "@/components/landing/Reveal";
import SectionIntro from "@/components/landing/SectionIntro";

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

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-sheet-rule bg-sheet py-24 text-sheet-ink lg:py-28"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal variant="up">
          <div className="grid gap-6 lg:grid-cols-12">
            <SectionIntro
              eyebrow="How it works"
              title="Tracking your money in three steps"
              description="From sign-up to your first logged transaction in under a minute."
              tone="sheet"
              titleClassName="lg:col-span-7"
              descriptionClassName="lg:col-span-4 lg:col-start-9"
            />
          </div>
        </Reveal>

        <ol className="mt-14 grid list-none border-t border-sheet-rule md:grid-cols-3">
          {steps.map(({ number, title, description }, index) => (
            <li
              key={number}
              className={`border-b border-sheet-rule py-8 md:border-b-0 md:py-10 ${
                index === 0
                  ? "md:pr-8"
                  : "md:border-l md:border-sheet-rule md:px-8"
              }`}
            >
              <Reveal variant="up" delay={index * 80}>
                <span className="ledger-num font-voice text-[4.5rem] italic leading-none tracking-[-0.02em] text-sheet-signal">
                  {number}
                </span>
                <h3 className="mt-6 font-display text-[1.25rem] font-semibold leading-snug tracking-[-0.02em] text-sheet-ink">
                  {title}
                </h3>
                <p className="mt-2 max-w-[34ch] text-pretty text-[15px] leading-[1.6] text-sheet-soft">
                  {description}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
