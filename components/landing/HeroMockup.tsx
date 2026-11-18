import { TrendingDown, TrendingUp } from "lucide-react";

interface SummaryCardData {
  label: string;
  value: string;
  delta: string;
  direction: "up" | "down";
  good: boolean;
}

const summaryCards: SummaryCardData[] = [
  {
    label: "Net balance",
    value: "$12,450",
    delta: "+$1,250",
    direction: "up",
    good: true,
  },
  {
    label: "Expenses",
    value: "$3,180",
    delta: "−12%",
    direction: "down",
    good: true,
  },
  {
    label: "Assets",
    value: "$86,200",
    delta: "+4.2%",
    direction: "up",
    good: true,
  },
];

function SummaryCell({ label, value, delta, direction, good }: SummaryCardData) {
  const TrendIcon = direction === "up" ? TrendingUp : TrendingDown;

  return (
    <div className="px-3 py-2 first:pl-0 last:pr-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-mute">
        {label}
      </p>
      <p className="ledger-num mt-1.5 text-[15px] font-semibold text-ink sm:text-base">
        {value}
      </p>
      <p
        className={`ledger-num mt-1 flex items-center gap-1 text-[11px] font-medium ${
          good ? "text-positive" : "text-negative"
        }`}
      >
        <TrendIcon className="h-3 w-3" aria-hidden="true" />
        {delta}
      </p>
    </div>
  );
}

function SavedThisMonth() {
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-28 w-28 shrink-0"
        role="img"
        aria-label="Saved this month by category"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(var(--color-clay) 0% 46%, var(--color-positive) 46% 72%, var(--color-surface-2) 72% 100%)",
          }}
        />
        <div className="absolute inset-[26%] flex flex-col items-center justify-center rounded-full bg-surface ring-1 ring-rule">
          <p className="ledger-num text-sm font-semibold text-ink">$1,250</p>
          <p className="text-[11px] text-ink-mute">saved</p>
        </div>
      </div>
      <dl className="flex flex-col gap-2 text-[12px] text-ink-soft">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-clay" aria-hidden="true" />
          <dt>Needs</dt>
          <dd className="ledger-num ml-auto pl-3 font-medium text-ink">46%</dd>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full bg-positive"
            aria-hidden="true"
          />
          <dt>Wants</dt>
          <dd className="ledger-num ml-auto pl-3 font-medium text-ink">26%</dd>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full bg-surface-2 ring-1 ring-rule-strong"
            aria-hidden="true"
          />
          <dt>Saved</dt>
          <dd className="ledger-num ml-auto pl-3 font-medium text-ink">28%</dd>
        </div>
      </dl>
    </div>
  );
}

export default function HeroMockup() {
  return (
    <div className="relative w-full rounded-md border border-rule-strong bg-surface p-5 shadow-[0_1px_0_var(--color-rule),0_40px_80px_-48px_rgba(27,26,22,0.55)] sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
          BudgetIQ · August ledger
        </p>
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-soft">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-positive"
            aria-hidden="true"
          />
          Live
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-rule border-y border-rule">
        {summaryCards.map((card) => (
          <SummaryCell key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
        <SavedThisMonth />
        <div className="flex flex-1 flex-col gap-2">
          <div className="max-w-[95%] self-start rounded-sm rounded-bl-none bg-surface-2 px-3 py-2 text-[13px] text-ink">
            I spent $15 on coffee
          </div>
          <div className="max-w-[95%] self-end rounded-sm rounded-br-none bg-clay px-3 py-2 text-[13px] font-medium text-on-clay">
            Logged ✓
          </div>
        </div>
      </div>
    </div>
  );
}
