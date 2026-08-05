import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const anchors = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNav() {
  return (
    <header className="navbar sticky top-0 z-30 border-b border-base-300/50 bg-base-100/80 backdrop-blur">
      <div className="navbar-start">
        <Link href="/" className="flex items-center gap-2 px-4 text-xl font-bold">
          <Image
            src="/logo-icon-light.png"
            alt="BudgetIQ logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
          BudgetIQ
        </Link>
      </div>
      <div className="navbar-center hidden md:flex">
        <ul className="menu menu-horizontal gap-1 px-1">
          {anchors.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="text-sm text-base-content/70 transition-colors hover:text-base-content"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="navbar-end gap-1 pr-3">
        <ThemeToggle />
        <Link href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
          Sign in
        </Link>
        <Link href="/login" className="btn btn-primary btn-sm">
          Get started
        </Link>
      </div>
    </header>
  );
}
