import ArrowUpRightIcon from "@/components/landing/ArrowUpRightIcon";
import Reveal from "@/components/landing/Reveal";
import SectionIntro from "@/components/landing/SectionIntro";

/** The policy below is quoted from this file, so the section can be checked
 *  against the repository instead of taken on faith. */
const policySource =
  "https://github.com/AmineMabrouk17/BudgetIQ/blob/main/supabase/migrations/0001_transactions.sql";

const remainingProofs = [
  {
    title: "MIT licensed",
    description:
      "The full source is on GitHub. Audit it, fork it, or lift the parts you want.",
  },
  {
    title: "Self-host it",
    description:
      "Point BudgetIQ at your own Supabase project and keep every record in infrastructure you control.",
  },
];

/**
 * The trust argument shown as the document that enforces it: the real RLS
 * policy, cited to its migration, with the two remaining proofs ruled in
 * underneath. One sheet instead of three icon cards, so the section proves
 * rather than asserts.
 */
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
              eyebrow="Why BudgetIQ"
              title="Open source is the trust model."
              description="No ads, no data sales, no black box. Read the code, check the security model, or run the whole app yourself."
              size="medium"
              titleMeasure="14ch"
              descriptionMeasure="38ch"
              descriptionClassName="mt-5"
            />
            <div className="mt-8">
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

          <Reveal
            variant="up"
            delay={80}
            className="lg:col-span-6 lg:col-start-7"
          >
            <div className="border border-rule-strong">
              <div className="border-b border-rule px-5 pb-5 pt-5 sm:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-display text-[1.2rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
                    Row-level security
                  </h3>
                  <a
                    href={policySource}
                    className="font-mono text-[11px] text-ink-mute underline-offset-4 transition-colors hover:text-signal hover:underline"
                  >
                    0001_transactions.sql
                  </a>
                </div>
                <p className="mt-2 max-w-[46ch] text-pretty text-[14.5px] leading-[1.6] text-ink-soft">
                  Every record is scoped to your account by Postgres RLS. You
                  only ever see your own data.
                </p>
              </div>

              <div className="border-b border-rule bg-canvas px-5 py-4 sm:px-6">
                <code className="block font-mono text-[12px] leading-[1.8] text-ink-soft sm:text-[13px]">
                  <span className="block">ALTER TABLE public.transactions</span>
                  <span className="block pl-4">
                    ENABLE ROW LEVEL SECURITY;
                  </span>
                  <span className="mt-3 block">
                    CREATE POLICY &quot;Users can manage their own
                  </span>
                  <span className="block pl-4">transactions&quot;</span>
                  <span className="block">ON public.transactions</span>
                  <span className="block">FOR ALL</span>
                  <span className="mt-3 -mx-5 block bg-signal-soft px-5 py-0.5 font-medium text-signal-deep sm:-mx-6 sm:px-6">
                    USING (auth.uid() = user_id);
                  </span>
                </code>
              </div>

              <div className="grid sm:grid-cols-2">
                {remainingProofs.map(({ title, description }, index) => (
                  <div
                    key={title}
                    className={`px-5 py-5 sm:px-6 ${
                      index === 0
                        ? "border-b border-rule sm:border-b-0 sm:border-r"
                        : ""
                    }`}
                  >
                    <h3 className="font-display text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
                      {title}
                    </h3>
                    <p className="mt-1.5 max-w-[40ch] text-pretty text-[14px] leading-[1.6] text-ink-soft">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
