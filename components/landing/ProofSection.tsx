import { Check, MessageSquare } from "lucide-react";
import ArrowUpRightIcon from "@/components/landing/ArrowUpRightIcon";
import Reveal from "@/components/landing/Reveal";
import SectionIntro from "@/components/landing/SectionIntro";

const proofs = [
  {
    title: "One confirmation",
    description:
      "Say it, confirm once, done. No forms, no spreadsheet, no manual entry.",
  },
  {
    title: "Phone and desktop",
    description:
      "The same flow one-handed on a phone or on a wide screen. Nothing to install.",
  },
  {
    title: "Open source",
    description:
      "MIT licensed. Read it, fork it, or self-host on your own Supabase project.",
  },
];

/**
 * The "Why BudgetIQ" argument, shown as the product doing the thing it claims:
 * a real phrase typed, an assistant that understands it, one confirmation click,
 * and the transaction is logged. Three small proofs underneath, so the section
 * demonstrates rather than asserts.
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
              title="Log a transaction the way you say it."
              description="Type “I spent $45 on groceries today” and BudgetIQ records it after one confirmation. No forms, no spreadsheets."
              size="medium"
              titleMeasure="16ch"
              descriptionMeasure="38ch"
              descriptionClassName="mt-5"
            />
            <div className="mt-8">
              <p className="max-w-[38ch] text-pretty text-[13px] leading-[1.6] text-ink-mute">
                No testimonials yet. This page would rather show the product than
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
            <div className="border border-rule-strong bg-canvas">
              <div className="border-b border-rule px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-signal-soft text-signal"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="font-display text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
                    AI assistant
                  </h3>
                  <span className="ml-auto font-mono text-[11px] text-ink-mute">
                    live
                  </span>
                </div>
              </div>

              <div className="space-y-4 px-5 py-6 sm:px-6">
                <div className="ml-auto max-w-[82%] bg-surface-2 px-4 py-2.5 text-[14px] leading-[1.5] text-ink">
                  I spent $45 on groceries today
                </div>

                <div className="max-w-[88%]">
                  <p className="font-voice text-[15px] leading-[1.5] text-ink-soft">
                    Got it — $45 expense, Groceries. Log it?
                  </p>
                  <div className="mt-3 border border-rule bg-surface px-4 py-3">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[13px] font-medium text-ink-soft">
                        Expense · Groceries
                      </span>
                      <span className="font-mono text-[15px] font-semibold tabular-nums text-ink">
                        $45.00
                      </span>
                    </div>
                    <div
                      aria-hidden="true"
                      className="mt-3 inline-flex w-full items-center justify-center bg-signal px-3 py-2 text-[13px] font-semibold text-on-signal"
                    >
                      Log transaction
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[13px] text-ink-mute">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-positive/15 text-positive"
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  Logged. Monthly spending: $1,240.00
                </div>
              </div>

              <div className="grid border-t border-rule sm:grid-cols-3">
                {proofs.map(({ title, description }, index) => (
                  <div
                    key={title}
                    className={`px-5 py-5 sm:px-6 ${
                      index < proofs.length - 1
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