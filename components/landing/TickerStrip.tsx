interface Entry {
  label: string;
  amount: string;
  tone: "in" | "out" | "neutral";
}

const entries: Entry[] = [
  { label: "Salary", amount: "+$3,200.00", tone: "in" },
  { label: "Groceries", amount: "−$86.40", tone: "out" },
  { label: "Coffee", amount: "−$4.20", tone: "out" },
  { label: "Freelance", amount: "+$450.00", tone: "in" },
  { label: "Subscriptions", amount: "−$38.90", tone: "out" },
  { label: "Utilities", amount: "−$120.00", tone: "out" },
  { label: "Assets", amount: "$86,200.00", tone: "neutral" },
];

const toneClass: Record<Entry["tone"], string> = {
  in: "text-positive",
  out: "text-negative",
  neutral: "text-ink",
};

function EntryList({ hidden }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-10 pr-10"
    >
      {entries.map((entry) => (
        <li
          key={entry.label}
          className="flex items-center gap-2.5 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute"
        >
          <span aria-hidden="true" className="h-1 w-1 shrink-0 bg-signal" />
          {entry.label}
          <span className={`ledger-num ${toneClass[entry.tone]}`}>
            {entry.amount}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A ledger that keeps moving while you read: the page's only ambient motion.
 * The second list is a duplicate so the -50% loop is seamless; screen readers
 * hear the entries once.
 */
export default function TickerStrip() {
  return (
    <div className="flex items-stretch border-b border-rule bg-surface">
      <div className="flex shrink-0 items-center gap-2 bg-signal px-4 text-[10px] font-medium uppercase tracking-[0.16em] text-on-signal sm:px-5">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 animate-pulse motion-reduce:animate-none bg-on-signal"
        />
        <span className="hidden sm:inline">Live ledger</span>
        <span className="sm:hidden">Live</span>
      </div>
      <div className="relative flex-1 overflow-hidden py-3">
        <div className="bi-marquee flex w-max">
          <EntryList />
          <EntryList hidden />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-surface to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent"
        />
      </div>
    </div>
  );
}
