import SectionHeading from "@/components/landing/SectionHeading";

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

function FaqItem({ question, answer, index }: FaqData & { index: number }) {
  return (
    <div className="collapse collapse-arrow rounded-2xl border border-base-300/60 bg-base-100">
      <input type="radio" name="faq" defaultChecked={index === 0} />
      <div className="collapse-title text-base font-semibold">{question}</div>
      <div className="collapse-content text-sm leading-relaxed text-base-content/70">
        {answer}
      </div>
    </div>
  );
}

export default function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 bg-base-200 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="Everything you might wonder before signing up — answered honestly."
        />
        <div className="mt-12 flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <FaqItem key={faq.question} {...faq} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
