import { ChevronDown } from "lucide-react";
import SectionHeading from "@/components/landing/SectionHeading";
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
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-medium text-ink transition-colors hover:text-clay group-open:text-clay [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown
          className="h-4 w-4 shrink-0 text-ink-mute transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="max-w-2xl pb-5 text-sm leading-[1.65] text-ink-soft">
        {answer}
      </div>
    </details>
  );
}

export default function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 border-b border-rule bg-surface py-20">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="Everything you might wonder before signing up, answered plainly."
        />
        <div className="mt-10 border-t border-rule">
          {faqs.map((faq, index) => (
            <Reveal key={faq.question} variant="up" delay={index * 50}>
              <FaqItem {...faq} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
