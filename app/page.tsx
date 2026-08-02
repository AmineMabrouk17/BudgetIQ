import { Wallet } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <Wallet className="mx-auto mb-6 h-16 w-16 text-primary" />
            <h1 className="text-5xl font-bold text-base-content">BudgetIQ</h1>
            <p className="py-6 text-base-content/70">
              Your AI-powered personal finance and budget planner. Track
              income, expenses, and assets — coming soon.
            </p>
            <button className="btn btn-primary">Get Started</button>
          </div>
        </div>
      </div>
    </main>
  );
}
