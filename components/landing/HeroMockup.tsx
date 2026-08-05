type Trend = "up" | "down";

interface SummaryCardData {
  label: string;
  value: string;
  delta: string;
  trend: Trend;
}

const summaryCards: SummaryCardData[] = [
  { label: "Net Balance", value: "$12,450", delta: "+$1,250", trend: "up" },
  { label: "Monthly Spend", value: "$3,180", delta: "-12%", trend: "down" },
  { label: "Total Assets", value: "$86,200", delta: "+4.2%", trend: "up" },
];

function SummaryCard({ label, value, delta, trend }: SummaryCardData) {
  return (
    <div className="rounded-xl border border-base-300/60 bg-base-200/60 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-base-content/60">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold sm:text-base">{value}</p>
      <p
        className={`mt-0.5 text-[10px] font-medium ${
          trend === "up" ? "text-primary" : "text-base-content/50"
        }`}
      >
        {delta}
      </p>
    </div>
  );
}

function DonutChart() {
  return (
    <div
      className="relative h-32 w-32 shrink-0"
      role="img"
      aria-label="Net balance breakdown"
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "conic-gradient(var(--color-primary) 0% 42%, var(--color-base-content) 42% 58%, var(--color-base-300) 58% 100%)",
        }}
      />
      <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full bg-base-100">
        <p className="text-sm font-bold">$1,250</p>
        <p className="text-[10px] text-base-content/60">saved</p>
      </div>
    </div>
  );
}

export default function HeroMockup() {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-base-300/60 bg-base-100 p-6 shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-error/70" aria-hidden="true" />
          <span
            className="h-3 w-3 rounded-full bg-warning/70"
            aria-hidden="true"
          />
          <span
            className="h-3 w-3 rounded-full bg-success/70"
            aria-hidden="true"
          />
        </div>
        <p className="text-xs font-medium text-base-content/60">
          BudgetIQ dashboard
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <DonutChart />
        <div className="flex flex-1 flex-col gap-2">
          <div className="max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-base-200 px-4 py-2 text-sm text-base-content">
            I spent $15 on coffee
          </div>
          <div className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm font-medium text-primary-content">
            Logged ✓
          </div>
        </div>
      </div>
    </div>
  );
}
