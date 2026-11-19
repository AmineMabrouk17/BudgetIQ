import { getTransactions } from "@/lib/transactions";
import { computeSummary } from "@/lib/summary";
import SummaryCards from "@/components/dashboard/SummaryCards";

/**
 * Server section behind the dashboard's summary cards.
 *
 * It lives in its own component so it can sit inside a Suspense boundary: the
 * page renders its shell immediately and this resolves — and streams — on its
 * own clock, alongside the analytics and transaction table sections.
 */
export default async function DashboardSummary() {
  const transactions = await getTransactions();
  const summary = computeSummary(transactions, new Date());

  return (
    <SummaryCards
      summary={summary}
      hasTransactions={transactions.length > 0}
    />
  );
}
