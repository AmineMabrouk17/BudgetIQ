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
      "Yes — free forever, with no ads. The whole app is open source under MIT, so you can even self-host it if you like.",
  },
  {
    question: "Is my financial data private?",
    answer:
      "Yes. Every record is protected by row-level security, so you only ever see your own data — and nothing is ever shared or sold.",
  },
  {
    question: "What does the AI assistant do with my data?",
    answer:
      "It acts only on what you tell it — nothing more. It logs the transactions you describe and never trains on your data.",
  },
  {
    question: "Is there a budget feature?",
    answer:
      "Not yet — BudgetIQ tracks income, expenses, and assets; budgets are on the roadmap.",
  },
  {
    question: "Which devices does BudgetIQ support?",
    answer:
      "BudgetIQ is a responsive web app that works on desktop, tablet, and phone — no install needed.",
  },
  {
    question: "How is BudgetIQ different from other finance apps?",
    answer:
      "AI-assisted logging from plain language, real-time net balance and asset tracking, daily financial quotes, and a fully open-source codebase — all free with no ads.",
  },
];

function FaqItem({ question, answer }: FaqData) {
  return (
    <details className="group rounded-2xl border border-white/[0.08] bg-night-raised transition-colors duration-300 hover:border-white/[0.18] hover:bg-white/[0.02] motion-reduce:transition-none">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-base font-semibold text-white/90 [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown
          className="h-5 w-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="px-5 pb-5 text-sm leading-[1.6] text-muted">{answer}</div>
    </details>
  );
}

export default function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 bg-night-alt py-20">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="Everything you might wonder before signing up — answered honestly."
        />
        <div className="mt-12 flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <Reveal key={faq.question} variant="up" delay={index * 70}>
              <FaqItem {...faq} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
