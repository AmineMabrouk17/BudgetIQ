import Link from "next/link";

export default function CtaBand() {
  return (
    <section className="bg-base-200 py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/70 px-6 py-16 text-center shadow-xl">
          <h2 className="text-3xl font-bold tracking-tight text-primary-content sm:text-4xl">
            Start tracking your money in minutes.
          </h2>
          <p className="mt-4 text-primary-content/80">
            Sign in with Google and let the AI assistant take care of the data
            entry.
          </p>
          <Link
            href="/login"
            className="btn btn-lg mt-8 border-0 bg-base-100 text-base-content hover:bg-base-200"
          >
            Get started
          </Link>
          <p className="mt-6 text-sm font-medium text-primary-content/80">
            Free forever · No credit card · Open source
          </p>
        </div>
      </div>
    </section>
  );
}
