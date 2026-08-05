import Link from "next/link";
import HeroMockup from "@/components/landing/HeroMockup";

export default function LandingHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-2 lg:pb-24 lg:pt-16">
      <div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Your money, finally under control.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-base-content/70">
          BudgetIQ is a free, open-source personal finance app. Track income,
          expenses, and assets — and let the AI assistant log them straight
          from your words. Sign in with Google in seconds.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/login" className="btn btn-primary btn-lg">
            Get started free
          </Link>
          <a
            href="https://github.com/AmineMabrouk17/BudgetIQ"
            className="btn btn-outline btn-lg"
          >
            View on GitHub
          </a>
        </div>
        <p className="mt-10 text-sm font-medium tracking-wide text-base-content/60">
          Free forever · Open source · No ads · Your data, yours
        </p>
      </div>
      <HeroMockup />
    </section>
  );
}
