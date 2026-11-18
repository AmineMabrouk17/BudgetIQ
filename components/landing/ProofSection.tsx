import { Code2, Server, ShieldCheck } from "lucide-react";
import ArrowUpRightIcon from "@/components/landing/ArrowUpRightIcon";
import Reveal from "@/components/landing/Reveal";
import SectionIntro from "@/components/landing/SectionIntro";

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
    <section
      id="proof"
      className="scroll-mt-20 border-b border-rule bg-surface py-24 lg:py-28"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal variant="up" className="lg:col-span-5">
            <SectionIntro
              title="Open source is the trust model."
              description="No ads, no data sales, no black box. Read the code, check the security model, or run the whole app yourself."
              size="medium"
              titleMeasure="14ch"
              descriptionMeasure="38ch"
              descriptionClassName="mt-5"
            />
            <div className="mt-8 border-t border-rule-strong pt-5">
              <p className="max-w-[38ch] text-pretty text-[13px] leading-[1.6] text-ink-mute">
                No testimonials yet. This page would rather show proof than
                quotes we cannot verify.
              </p>
              <a
                href="https://github.com/AmineMabrouk17/BudgetIQ"
                className="group mt-4 inline-flex min-h-6 items-center gap-1.5 py-1 text-[13px] font-semibold text-ink transition-colors hover:text-signal"
              >
                Read the source
                <ArrowUpRightIcon />
              </a>
            </div>
          </Reveal>

          <div className="lg:col-span-6 lg:col-start-7">
            {proofs.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} variant="up" delay={index * 70}>
                <article
                  className={`flex gap-5 border-t border-rule-strong ${
                    index === 0 ? "pt-0" : "py-6"
                  }`}
                >
                  <Icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-signal"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-display text-[1.15rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
                      {title}
                    </h3>
                    <p className="mt-2 max-w-[44ch] text-pretty text-[15px] leading-[1.6] text-ink-soft">
                      {description}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
