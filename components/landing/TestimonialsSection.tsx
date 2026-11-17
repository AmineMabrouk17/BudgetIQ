import { Check } from "lucide-react";
import SectionHeading from "@/components/landing/SectionHeading";
import Reveal from "@/components/landing/Reveal";

interface Reason {
  title: string;
  detail: string;
}

// Facts already true in the product and repository — never invent social proof.
const reasons: Reason[] = [
  {
    title: "Free and open source",
    detail: "Self-host it, fork it, or use the hosted demo. No hidden costs.",
  },
  {
    title: "Private by default",
    detail:
      "Supabase Row-Level Security means every user only ever sees their own data.",
  },
  {
    title: "No ads, no upsell",
    detail: "Your dashboard stays about your money, not someone else's pitch.",
  },
  {
    title: "Log it by describing it",
    detail:
      "Describe an income, expense, or asset and confirm one card — no spreadsheet drudgery.",
  },
];

function ReasonCard({ title, detail }: Reason) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-night-raised p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-[0_24px_48px_-16px_rgba(0,0,0,0.55)] motion-reduce:hover:transform-none motion-reduce:transition-none">
      <Check className="h-6 w-6 text-pop-yellow" aria-hidden="true" />
      <h3 className="mt-4 font-semibold text-white/90">{title}</h3>
      <p className="mt-2 flex-1 leading-[1.6] text-muted">{detail}</p>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section id="why-budgetiq" className="scroll-mt-20 bg-night py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Why BudgetIQ"
          title="Why people choose BudgetIQ"
          description="Four commitments we can actually stand behind."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {reasons.map((reason, index) => (
            <Reveal
              key={reason.title}
              variant="up"
              delay={index * 90}
              className="h-full"
            >
              <ReasonCard {...reason} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
