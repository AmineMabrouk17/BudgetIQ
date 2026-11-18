import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Clapperboard,
  Coffee,
  Plane,
  ShoppingBasket,
} from "lucide-react";
import AnimatedHeroTitle from "@/components/landing/AnimatedHeroTitle";
import HeroMockup from "@/components/landing/HeroMockup";
import Parallax from "@/components/landing/Parallax";
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

const categories = [
  { icon: ShoppingBasket, label: "Groceries" },
  { icon: Coffee, label: "Coffee" },
  { icon: Plane, label: "Travel" },
  { icon: Baby, label: "Baby" },
  { icon: Clapperboard, label: "Subscriptions" },
];

export default function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-rule">
      <Parallax
        speed={0.06}
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem]"
      >
        <div
          aria-hidden="true"
          className="h-full w-full bg-[radial-gradient(70%_60%_at_75%_10%,var(--color-clay-soft),transparent_70%)]"
        />
      </Parallax>

      <div className="mx-auto grid max-w-6xl gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-24">
        <div>
          <div className="bi-rise flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <PillTag key={category.label} {...category} />
            ))}
          </div>

          <div className="mt-8">
            <AnimatedHeroTitle
              lines={["Say what you spent.", "It’s already logged."]}
            />
          </div>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-[1.65] text-ink-soft">
            BudgetIQ tracks your Income, Expenses, and Assets in one place.
            Describe a transaction the way you would say it out loud, and the
            AI assistant logs it after one quick confirmation.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-sm bg-clay px-6 py-3 text-base font-semibold text-on-clay transition-colors hover:bg-clay-deep"
            >
              Get started free
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
              />
            </Link>
            <a
              href="https://github.com/AmineMabrouk17/BudgetIQ"
              className="inline-flex items-center gap-2 rounded-sm border border-rule-strong px-6 py-3 text-base font-semibold text-ink transition-colors hover:border-ink hover:bg-surface"
            >
              <GithubIcon />
              View on GitHub
            </a>
          </div>

          <p className="mt-10 text-[13px] font-medium uppercase tracking-[0.12em] text-ink-mute">
            Free forever · Open source · No ads · Your data, yours
          </p>
        </div>

        <div className="w-full max-w-md justify-self-center lg:max-w-none">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
