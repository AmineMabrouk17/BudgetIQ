import ArrowUpRightIcon from "@/components/landing/ArrowUpRightIcon";
import { Check, TrendingUp } from "lucide-react";
import { ledgerSamples, sheetToneClass } from "@/components/landing/ledger";

const ledgerRows = ledgerSamples.filter(({ category }) =>
  ["Salary", "Groceries", "Assets"].includes(category)
);

/**
 * The product as a physical artifact: a statement that stays dark in both
 * themes, so the hero always has one object to look at rather than a glowing
 * screenshot of a dashboard.
 */
export default function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[26rem]">
      <div className="border border-sheet-rule bg-sheet text-sheet-ink shadow-[0_28px_70px_-30px_rgba(12,17,22,0.65)]">
        <div className="flex items-center justify-between gap-4 border-b border-sheet-rule px-5 py-3.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-sheet-ink/60">
            August statement
          </p>
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-sheet-ink/70">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 bg-sheet-soft"
            />
            Live
          </p>
        </div>

        <div className="px-5 pb-5 pt-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-sheet-ink/60">
            Net balance
          </p>
          <p className="ledger-num mt-2 text-[2.6rem] leading-none tracking-[-0.03em]">
            $12,450
            <span className="text-[1.4rem] text-sheet-ink/40">.00</span>
          </p>
          <p className="ledger-num mt-3 flex items-center gap-1.5 text-[12px] text-sheet-positive">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            +$1,250 this month
          </p>
        </div>

        <dl className="divide-y divide-sheet-rule border-y border-sheet-rule">
          {ledgerRows.map((row) => (
            <div
              key={row.category}
              className="flex items-baseline justify-between gap-4 px-5 py-3"
            >
              <div className="flex items-baseline gap-3">
                <dt className="text-[13px] font-medium text-sheet-ink/85">
                  {row.category}
                </dt>
                <dd className="text-[10px] uppercase tracking-[0.12em] text-sheet-ink/55">
                  {row.meta}
                </dd>
              </div>
              <dd
                className={`ledger-num text-[13px] font-medium ${sheetToneClass[row.tone]}`}
              >
                {row.amount}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-2 px-5 py-5">
          <p className="max-w-[85%] self-start bg-sheet-ink/[0.07] px-3.5 py-2 text-[13px] leading-[1.5] text-sheet-ink/90">
            I spent $15 on coffee
          </p>
          <p className="flex max-w-[85%] items-center gap-2 self-end bg-signal px-3.5 py-2 text-[13px] leading-[1.5] text-on-signal">
            Logged
            <span className="font-voice text-[1.15em] italic">— got it.</span>
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 bg-signal px-5 py-4 text-on-signal">
          <p className="text-[12px] font-medium text-on-signal/85">
            Type a transaction
            <span className="text-on-signal/60">…</span>
          </p>
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 items-center justify-center bg-on-signal text-signal"
          >
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
