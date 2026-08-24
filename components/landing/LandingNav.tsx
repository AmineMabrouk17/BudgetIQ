import Image from "next/image";
import Link from "next/link";

const anchors = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-30 bg-night/60 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-icon-light.png"
            alt="BudgetIQ logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          <span className="font-display font-bold text-lg text-white/90">
            BudgetIQ
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {anchors.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-muted transition-colors hover:text-white/90"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-white/90 transition-colors hover:text-white sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#010D1F] transition-colors hover:bg-white/90"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
