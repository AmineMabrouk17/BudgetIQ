/**
 * The landing wordmark: four ledger cells, one already logged, set beside the
 * product name. The cells are the smallest statement of the idea — structure,
 * with one thing recorded.
 */
export default function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2.5 font-display text-[1.15rem] font-bold tracking-[-0.03em]">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6 shrink-0"
        focusable="false"
      >
        <rect x="2" y="2" width="9" height="9" className="fill-ink" />
        <rect x="13" y="2" width="9" height="9" className="fill-ink" />
        <rect x="2" y="13" width="9" height="9" className="fill-ink" />
        <rect x="13" y="13" width="9" height="9" className="fill-signal" />
      </svg>
      BudgetIQ
    </span>
  );
}
