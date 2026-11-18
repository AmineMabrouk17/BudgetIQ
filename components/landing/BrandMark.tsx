interface BrandMarkProps {
  className?: string;
}

/**
 * Four ledger cells, one of them in the action colour: the page's smallest
 * statement of the product's idea (structure, with one thing already logged).
 */
export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      focusable="false"
    >
      <rect x="2" y="2" width="9" height="9" className="fill-ink" />
      <rect x="13" y="2" width="9" height="9" className="fill-ink" />
      <rect x="2" y="13" width="9" height="9" className="fill-ink" />
      <rect x="13" y="13" width="9" height="9" className="fill-signal" />
    </svg>
  );
}
