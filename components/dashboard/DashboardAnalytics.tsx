import { getTransactions } from "@/lib/transactions";
import LazyAnalyticsContainer from "@/components/dashboard/LazyAnalyticsContainer";

/**
 * Server section behind the dashboard's analytics charts.
 *
 * `getTransactions` is memoised per request, so this shares the single
 * unbounded transaction query with the summary section even though the two
 * resolve inside separate Suspense boundaries.
 */
export default async function DashboardAnalytics() {
  const transactions = await getTransactions();

  return <LazyAnalyticsContainer transactions={transactions} />;
}