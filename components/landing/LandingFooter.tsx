const productLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-night">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <p className="text-sm font-medium text-muted">
          BudgetIQ · Open source under MIT
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {productLinks.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  className="text-sm text-muted transition-colors hover:text-white/90"
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="https://github.com/AmineMabrouk17/BudgetIQ"
                className="text-sm text-base-content/70 transition-colors hover:text-base-content"
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
