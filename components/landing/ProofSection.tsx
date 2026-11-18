import { ArrowUpRight, Code2, Server, ShieldCheck } from "lucide-react";
import SectionHeading from "@/components/landing/SectionHeading";
import Reveal from "@/components/landing/Reveal";

const proofs = [
  {
    icon: ShieldCheck,
    title: "Row-level security",
    description:
      "Every record is scoped to your account by Postgres RLS. You only ever see your own data.",
  },
  {
    icon: Code2,
    title: "MIT licensed",
    description:
      "The full source is on GitHub. Audit it, fork it, or lift the parts you want.",
  },
  {
    icon: Server,
    title: "Self-host it",
    description:
      "Point BudgetIQ at your own Supabase project and keep every record in infrastructure you control.",
  },
];

export default function ProofSection() {
  return (
    <section id="proof" className="scroll-mt-20 border-b border-rule bg-canvas py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Why BudgetIQ"
          title="Open source is the trust model."
          description="No ads, no data sales, no black box. Read the code, check the security model, or run the whole app yourself."
        />
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {proofs.map(({ icon: Icon, title, description }, index) => (
            <Reveal
              key={title}
              variant="up"
              delay={index * 80}
              className="h-full"
            >
              <div className="h-full border-t border-rule-strong pt-5">
                <Icon className="h-5 w-5 text-clay" aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl font-normal tracking-[-0.02em] text-ink">
                  {title}
                </h3>
                <p className="mt-2 text-pretty text-sm leading-[1.65] text-ink-soft">
                  {description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-rule-strong pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-pretty text-sm leading-[1.65] text-ink-soft">
            No testimonials yet. This page would rather show proof than quotes
            we cannot verify.
          </p>
          <a
            href="https://github.com/AmineMabrouk17/BudgetIQ"
            className="group inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-clay"
          >
            Read the source
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:translate-x-0"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
