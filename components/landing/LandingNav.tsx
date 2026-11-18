import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const anchors = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#proof", label: "Open source" },
  { href: "#faq", label: "FAQ" },
];

function LedgerMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 shrink-0 text-clay"
    >
      <path d="M4 5h16M4 10h16M4 15h7M4 19h7" />
      <path d="M14 19l3-4 3 2" />
    </svg>
  );
}

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-6 py-3 md:h-16 md:flex-nowrap md:py-0">
        <Link
          href="/"
          className="order-1 flex items-center gap-2.5 text-ink transition-colors hover:text-clay"
        >
          <LedgerMark />
          <span className="font-display text-lg font-normal tracking-[-0.02em]">
            BudgetIQ
          </span>
        </Link>

        <nav
          aria-label="Sections"
          className="order-3 -mx-1 flex w-full items-center gap-5 overflow-x-auto px-1 pb-1 md:order-2 md:mx-0 md:w-auto md:flex-1 md:justify-center md:overflow-visible md:px-0 md:pb-0"
        >
          {anchors.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="flex min-h-11 items-center whitespace-nowrap text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3 md:ml-0 md:gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden px-2 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-sm bg-clay px-4 py-2 text-[13px] font-semibold text-on-clay transition-colors hover:bg-clay-deep"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
