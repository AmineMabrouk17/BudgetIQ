import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroMockup from "@/components/landing/HeroMockup";
import PillTag from "@/components/landing/PillTag";

function GithubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z"
      />
    </svg>
  );
}

export default function LandingHero() {
  return (
    <section className="relative mx-auto w-full max-w-6xl overflow-visible px-6 pb-24 pt-20 text-center lg:pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 left-1/4 -z-10 h-72 w-72 rounded-full bg-accent/25 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/4 bottom-0 -z-10 h-72 w-72 rounded-full bg-pop-purple/20 blur-[120px]"
      />

      <div className="relative">
        <PillTag
          emoji="🥑"
          label="Groceries"
          colorClass="bg-pop-green"
          rotationDeg={-8}
          className="absolute -left-2 top-6 z-10 hidden md:inline-flex"
        />
        <PillTag
          emoji="🧸"
          label="Baby"
          colorClass="bg-pop-pink"
          rotationDeg={7}
          className="absolute right-0 top-10 z-10 hidden md:inline-flex"
        />
        <PillTag
          emoji="☕"
          label="Coffee"
          colorClass="bg-pop-orange"
          rotationDeg={-6}
          className="absolute left-4 top-1/2 z-10 hidden md:inline-flex"
        />
        <PillTag
          emoji="🎬"
          label="Subscriptions"
          colorClass="bg-pop-purple"
          rotationDeg={9}
          className="absolute top-1/2 right-6 z-10 hidden md:inline-flex"
        />
        <PillTag
          emoji="✈️"
          label="Travel"
          colorClass="bg-pop-yellow"
          rotationDeg={-9}
          className="absolute bottom-0 left-8 z-10 hidden md:inline-flex"
        />
        <h1 className="mx-auto max-w-5xl font-display text-[length:clamp(3rem,9vw,9rem)] leading-[0.9] font-semibold tracking-[-0.02em] text-white/90">
          <span className="block">Your money,</span>
          <span className="block">finally under control.</span>
        </h1>
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-lg leading-[1.6] text-muted">
        BudgetIQ is a free, open-source personal finance app. Track income,
        expenses, and assets — and let the AI assistant log them straight from
        your words. Sign in with Google in seconds.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-accent-bright"
        >
          Get started free
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <a
          href="https://github.com/AmineMabrouk17/BudgetIQ"
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-[#010D1F] transition-colors hover:bg-white/90"
        >
          <GithubIcon />
          View on GitHub
        </a>
      </div>

      <p className="mt-14 text-[13px] uppercase tracking-[0.01em] text-muted">
        Free forever · Open source · No ads · Your data, yours
      </p>

      <div className="mx-auto mt-16 w-full max-w-xl">
        <HeroMockup />
      </div>
    </section>
  );
}
