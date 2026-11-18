const productLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#proof", label: "Why BudgetIQ" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-rule bg-canvas">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <p className="text-sm font-medium text-ink-soft">
          BudgetIQ · Open source under MIT
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {productLinks.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  className="text-[13px] text-ink-mute transition-colors hover:text-ink"
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="https://github.com/AmineMabrouk17/BudgetIQ"
                className="text-[13px] text-ink-mute transition-colors hover:text-ink"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
