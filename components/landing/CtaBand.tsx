import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/landing/Reveal";

export default function CtaBand() {
  return (
    <section className="bg-canvas py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal variant="up">
          <div className="relative overflow-hidden rounded-md bg-ink px-6 py-16 text-center sm:px-12">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-clay"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 -top-16 select-none font-display text-[16rem] leading-none text-canvas/[0.05]"
            >
              $
            </span>
            <h2 className="relative text-balance font-display text-[length:clamp(1.9rem,3.6vw,2.75rem)] font-normal leading-[1.1] tracking-[-0.02em] text-canvas">
              Start tracking your money in minutes.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-pretty leading-[1.65] text-canvas/75">
              Sign in with Google and let the AI assistant take care of the data
              entry.
            </p>
            <Link
              href="/login"
              className="group relative mt-8 inline-flex items-center gap-2 rounded-sm bg-clay px-6 py-3 text-base font-semibold text-on-clay transition-colors hover:bg-clay-deep"
            >
              Get started
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
              />
            </Link>
            <p className="relative mt-6 text-sm font-medium text-canvas/70">
              Free forever · No credit card · Open source
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
