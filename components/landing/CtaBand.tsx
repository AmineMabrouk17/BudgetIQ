import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Parallax from "@/components/landing/Parallax";
import Reveal from "@/components/landing/Reveal";

export default function CtaBand() {
  return (
    <section className="bg-night py-20">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-accent-bright to-accent-deep px-6 py-16 text-center shadow-2xl">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/20 blur-3xl bi-drift"
            />
            <h2 className="text-3xl font-display font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Start tracking your money in minutes.
            </h2>
            <p className="mt-4 leading-[1.6] text-white/85">
              Sign in with Google and let the AI assistant take care of the data
              entry.
            </p>
            <Link
              href="/login"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-[#010D1F] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-xl active:translate-y-0 motion-reduce:hover:transform-none"
            >
              Get started
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
              />
            </Link>
            <p className="mt-6 text-sm font-medium text-white/85">
              Free forever · No credit card · Open source
            </p>
          </div>
        </Reveal>
        <Parallax
          speed={0.1}
          className="pointer-events-none mx-auto mt-8 h-40 w-2/3 max-w-xl"
        >
          <div
            aria-hidden="true"
            className="h-full w-full rounded-full bg-accent/30 blur-[100px]"
          />
        </Parallax>
      </div>
    </section>
  );
}
