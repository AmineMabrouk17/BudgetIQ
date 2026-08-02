import { getUser } from "@/lib/supabase/server";
import { computeSummary, getTransactions } from "@/lib/transactions";
import SummaryCards from "@/components/dashboard/SummaryCards";

export default async function DashboardPage() {
  const user = await getUser();
  const transactions = await getTransactions();
  const summary = computeSummary(transactions);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-3xl font-bold text-base-content">Dashboard</h1>
        <p className="text-base-content/70">
          Signed in as {user?.email ?? "a BudgetIQ user"}
        </p>
      </header>
      <SummaryCards summary={summary} hasTransactions={transactions.length > 0} />
    </main>
  );
}
