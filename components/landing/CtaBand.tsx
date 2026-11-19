import Link from "next/link";
import ArrowUpRightIcon from "@/components/landing/ArrowUpRightIcon";
import Reveal from "@/components/landing/Reveal";

export default function CtaBand() {
  return (
    <section id="cta" className="scroll-mt-20 bg-canvas py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal variant="up">
          <div className="relative overflow-hidden bg-signal px-6 py-20 sm:px-12">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-24 select-none font-display text-[22rem] font-bold leading-none tracking-[-0.06em] text-on-signal/[0.07]"
            >
              $
            </span>
            <div className="relative mx-auto max-w-3xl text-center">
              <h2 className="text-balance font-display text-[length:clamp(1.9rem,7vw,4rem)] font-bold leading-[0.98] tracking-[-0.035em] text-on-signal">
                Start tracking
                <br /> your money{" "}
                <span className="font-voice text-[1.04em] font-normal italic tracking-[-0.015em]">
                  in minutes.
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-pretty text-[16px] leading-[1.65] text-on-signal/85">
                Sign in with Google and let the AI assistant take care of the
                data entry.
              </p>
              <Link
                href="/login"
                className="group mt-9 inline-flex items-center gap-2 bg-ink px-7 py-3.5 text-[15px] font-semibold text-canvas transition-colors hover:bg-canvas hover:text-ink"
              >
                Get started
                <ArrowUpRightIcon />
              </Link>
              <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.16em] text-on-signal/75">
                Free forever · No credit card · Open source
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
