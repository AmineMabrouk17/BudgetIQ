import {
  getTransactions,
  getTransactionsBetween,
  getTransactionsPage,
  type TransactionScopeFilter,
} from "@/lib/transactions";
import {
  computeSummary,
  getPayCycleBounds,
  type Summary,
} from "@/lib/summary";
import { getProfile } from "@/lib/profiles";
import SummaryCards from "@/components/dashboard/SummaryCards";
import ScopeFilter from "@/components/dashboard/ScopeFilter";
import TransactionTable from "@/components/dashboard/TransactionTable";
import LazyAnalyticsContainer from "@/components/dashboard/LazyAnalyticsContainer";
import AddTransactionModal from "@/components/dashboard/AddTransactionModal";
import ChatDrawer from "@/components/ai/ChatDrawer";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawScope = resolved.scope;
  const scope: TransactionScopeFilter =
    rawScope === "business" || rawScope === "personal" ? rawScope : null;

  const [transactions, page, profile] = await Promise.all([
    getTransactions(),
    getTransactionsPage(undefined, scope),
    getProfile(),
  ]);

  const payday = profile?.payday ?? null;
  const expectedIncome = profile?.expected_income ?? null;
  const isCycleEligible =
    payday !== null &&
    expectedIncome !== null &&
    (profile?.income_type === "salaried" || profile?.income_type === "hourly");
  const isFreelancer = profile?.income_type === "freelancer";
  const isBusiness = profile?.income_type === "business";

  let summary: Summary;
  if (isCycleEligible) {
    const bounds = getPayCycleBounds(payday);
    const cycleTransactions = await getTransactionsBetween(
      bounds.previousStart.toISOString(),
      bounds.currentEnd.toISOString()
    );
    summary = computeSummary(transactions, new Date(), {
      payCycle: { payday, expectedIncome, cycleTransactions },
    });
  } else if (isFreelancer) {
    summary = computeSummary(transactions, new Date(), { freelance: {} });
  } else if (isBusiness) {
    summary = computeSummary(transactions, new Date(), { business: true });
  } else {
    summary = computeSummary(transactions);
  }

  return (
    <ChatDrawer>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-base-content">Dashboard</h1>
          <AddTransactionModal />
        </header>
        <SummaryCards
          summary={summary}
          hasTransactions={transactions.length > 0}
          incomeType={profile?.income_type ?? "salaried"}
        />
        <div className="flex items-center justify-end">
          <ScopeFilter scope={scope} />
        </div>
        <LazyAnalyticsContainer transactions={transactions} />
        <TransactionTable
          transactions={page.transactions}
          nextCursor={page.nextCursor}
          scope={scope}
        />
      </main>
    </ChatDrawer>
  );
}
