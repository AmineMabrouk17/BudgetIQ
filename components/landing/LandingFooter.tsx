import BrandMark from "@/components/landing/BrandMark";

const productLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#proof", label: "Why BudgetIQ" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-rule bg-canvas">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-ink">
              <BrandMark className="h-6 w-6 shrink-0" />
              <span className="font-display text-[1.15rem] font-bold tracking-[-0.03em]">
                BudgetIQ
              </span>
            </div>
            <p className="mt-4 max-w-[34ch] text-[13px] leading-[1.6] text-ink-mute">
              BudgetIQ · Open source under MIT
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-12 gap-y-2.5 sm:flex sm:gap-x-7">
              {productLinks.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="inline-flex min-h-6 items-center py-1 text-[13px] text-ink-soft transition-colors hover:text-ink"
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="https://github.com/AmineMabrouk17/BudgetIQ"
                  className="inline-flex min-h-6 items-center py-1 text-[13px] text-ink-soft transition-colors hover:text-ink"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
