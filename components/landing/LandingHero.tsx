import Image from "next/image";

export default function LandingHero() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <Image
            src="/logo-vertical-light.png"
            alt="BudgetIQ logo"
            width={320}
            height={320}
            priority
            className="mx-auto mb-6 h-auto w-full max-w-xs"
          />
          <p className="py-6 text-base-content/70">
            Your AI-powered personal finance and budget planner. Track income,
            expenses, and assets — coming soon.
          </p>
          <a href="/login" className="btn btn-primary">
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}
