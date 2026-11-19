import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import BrandMark from "@/components/landing/BrandMark";

const anchors = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#proof", label: "Open source" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-6 py-3 md:h-16 md:flex-nowrap md:py-0 lg:px-10">
        <Link
          href="/"
          className="order-1 flex items-center text-ink transition-colors hover:text-signal"
        >
          <BrandMark />
        </Link>

        <nav
          aria-label="Sections"
          className="order-3 -mx-1 flex w-full items-center gap-6 overflow-x-auto px-1 pb-1 md:order-2 md:mx-0 md:w-auto md:flex-1 md:justify-center md:overflow-visible md:px-0 md:pb-0"
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
            className="hidden min-h-11 items-center px-2 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center gap-2 bg-ink px-4 text-[13px] font-semibold text-canvas transition-colors hover:bg-signal hover:text-on-signal"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
