import Link from "next/link";
import AnimatedHeroTitle from "@/components/landing/AnimatedHeroTitle";
import ArrowUpRightIcon from "@/components/landing/ArrowUpRightIcon";
import HeroMockup from "@/components/landing/HeroMockup";

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
    <section className="relative overflow-hidden border-b border-rule">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 pb-16 pt-14 lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="lg:col-span-7 lg:pr-10">
          <AnimatedHeroTitle
            lines={["Say what", "you spent.", "It’s already logged."]}
            voiceLineIndex={2}
          />

          <p className="mt-6 max-w-[46ch] text-pretty text-[17px] leading-[1.62] text-ink-soft lg:text-[18px] lg:leading-[1.6]">
            BudgetIQ tracks your Income, Expenses, and Assets in one place.
            Describe a transaction the way you would say it out loud, and the
            AI assistant logs it after one quick confirmation.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 bg-ink px-3.5 py-3.5 text-[15px] font-semibold text-canvas transition-colors hover:bg-signal hover:text-on-signal sm:px-6"
            >
              Get started free
              <ArrowUpRightIcon />
            </Link>
            <a
              href="https://github.com/AmineMabrouk17/BudgetIQ"
              className="inline-flex items-center gap-2 border border-rule-strong px-3.5 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:border-ink hover:bg-surface sm:px-6"
            >
              <GithubIcon />
              View on GitHub
            </a>
          </div>

          <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule pt-4 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            <span>Free forever</span>
            <span aria-hidden="true" className="h-3 w-px bg-rule-strong" />
            <span>Open source</span>
            <span aria-hidden="true" className="h-3 w-px bg-rule-strong" />
            <span>No ads</span>
            <span aria-hidden="true" className="h-3 w-px bg-rule-strong" />
            <span>Your data, yours</span>
          </p>
        </div>

        <div className="w-full lg:col-span-5">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
