"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

const anchors = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  function closeMenuAndRestoreFocus() {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }

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
              className="relative text-sm font-medium text-muted transition-colors hover:text-white/90 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full motion-reduce:after:hidden"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:border-white/30 md:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-section-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
            Menu
          </button>
          <Link
            href="/login"
            className="hidden text-sm font-medium text-white/90 transition-colors hover:text-white sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="group inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#010D1F] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-xl active:translate-y-0 motion-reduce:hover:transform-none"
          >
            Get started
          </Link>
        </div>
      </div>
      <nav
        id="mobile-section-nav"
        aria-label="Sections"
        hidden={!menuOpen}
        className="border-t border-white/10 px-6 pb-4 pt-2 md:hidden"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-1">
          {anchors.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={closeMenuAndRestoreFocus}
              className="rounded-lg px-2 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/5"
            >
              {label}
            </a>
          ))}
          <Link
            href="/login"
            onClick={closeMenuAndRestoreFocus}
            className="rounded-lg px-2 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/5"
          >
            Log in
          </Link>
        </div>
      </nav>
    </header>
  );
}
