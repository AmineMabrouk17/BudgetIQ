import { Plus } from "lucide-react";
import Reveal from "@/components/landing/Reveal";

interface FaqData {
  question: string;
  answer: string;
}

const faqs: FaqData[] = [
  {
    question: "Is BudgetIQ really free?",
    answer:
      "Yes. It is free forever, with no ads. The whole app is open source under MIT, so you can even self-host it if you like.",
  },
  {
    question: "Is my financial data private?",
    answer:
      "Yes. Every record is protected by row-level security, so you only ever see your own data. Nothing is shared or sold.",
  },
  {
    question: "What does the AI assistant do with my data?",
    answer:
      "It acts only on what you tell it. It logs the transactions you describe and never trains on your data.",
  },
  {
    question: "Is there a budget feature?",
    answer:
      "No. BudgetIQ tracks Income, Expense, and Asset. It has no budgets, limits, or alerts, and that is deliberate.",
  },
  {
    question: "Which devices does BudgetIQ support?",
    answer:
      "BudgetIQ is a responsive web app that works on desktop, tablet, and phone. No install needed.",
  },
  {
    question: "How is BudgetIQ different from other finance apps?",
    answer:
      "AI-assisted logging from plain language, real-time net balance and asset tracking, tailored KPI cards, and a fully open-source codebase. All free, with no ads.",
  },
];

function FaqItem({ question, answer }: FaqData) {
  return (
    <details className="group border-b border-rule">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[16px] font-medium text-ink transition-colors hover:text-signal group-open:text-signal [&::-webkit-details-marker]:hidden">
        {question}
        <Plus
          className="h-4 w-4 shrink-0 text-ink-mute transition-transform duration-300 group-open:rotate-45 group-open:text-signal"
          aria-hidden="true"
        />
      </summary>
      <div className="max-w-[60ch] pb-6 pr-10 text-[15px] leading-[1.65] text-ink-soft">
        {answer}
      </div>
    </details>
  );
}

export default function FaqSection() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 border-b border-rule bg-canvas py-24 lg:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-12 lg:gap-8 lg:px-10">
        <Reveal variant="up" className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <h2 className="max-w-[12ch] text-balance font-display text-[length:clamp(2.2rem,4.2vw,3.2rem)] font-bold leading-[0.99] tracking-[-0.035em] text-ink">
              Questions, answered
            </h2>
            <p className="mt-5 max-w-[34ch] text-pretty text-[15px] leading-[1.65] text-ink-soft">
              Everything you might wonder before signing up, answered plainly.
            </p>
          </div>
        </Reveal>

        <div className="border-t border-rule-strong lg:col-span-7 lg:col-start-6">
          {faqs.map((faq, index) => (
            <Reveal key={faq.question} variant="up" delay={index * 40}>
              <FaqItem {...faq} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
