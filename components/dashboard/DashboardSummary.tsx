import { getProfile } from "@/lib/profiles";
import { getTransactions, getTransactionsBetween } from "@/lib/transactions";
import {
  computeSummary,
  getPayCycleBounds,
  summaryOptionsFor,
  summaryPlanFor,
} from "@/lib/summary";
import type { Transaction } from "@/types/transaction";
import SummaryCards from "@/components/dashboard/SummaryCards";

/**
 * Server section behind the dashboard's summary cards.
 *
 * It lives in its own component so it can sit inside a Suspense boundary: the
 * page renders its shell immediately and this resolves — and streams — on its
 * own clock, alongside the analytics and transaction table sections.
 */
export default async function DashboardSummary() {
  const profile = await getProfile();
  const plan = summaryPlanFor(profile);

  const bounds =
    plan.kind === "payCycle" ? getPayCycleBounds(plan.payday) : null;

  // The pay-cycle window is derived from the profile rather than from the
  // transaction list, so it can be requested in the same batch instead of
  // costing a second, serialised round-trip after the list lands.
  const [transactions, cycleTransactions] = await Promise.all([
    getTransactions(),
    bounds
      ? getTransactionsBetween(
          bounds.previousStart.toISOString(),
          bounds.currentEnd.toISOString()
        )
      : Promise.resolve([] as Transaction[]),
  ]);

  const summary = computeSummary(
    transactions,
    new Date(),
    summaryOptionsFor(plan, cycleTransactions)
  );

  return (
    <SummaryCards
      summary={summary}
      hasTransactions={transactions.length > 0}
      incomeType={profile?.income_type ?? "salaried"}
    />
  );
}