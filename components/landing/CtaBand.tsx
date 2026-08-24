import Link from "next/link";

export default function CtaBand() {
  return (
    <section className="bg-night py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-3xl bg-gradient-to-br from-accent via-accent-bright to-accent-deep px-6 py-16 text-center shadow-2xl">
          <h2 className="text-3xl font-display font-semibold tracking-[-0.02em] text-white sm:text-4xl">
            Start tracking your money in minutes.
          </h2>
          <p className="mt-4 leading-[1.6] text-white/85">
            Sign in with Google and let the AI assistant take care of the data
            entry.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center rounded-full bg-white px-6 py-3 text-base font-semibold text-[#010D1F] transition-colors hover:bg-white/90"
          >
            Get started
          </Link>
          <p className="mt-6 text-sm font-medium text-white/85">
            Free forever · No credit card · Open source
          </p>
        </div>
      </div>
    </section>
  );
}
