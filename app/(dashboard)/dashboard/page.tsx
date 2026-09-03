import {
  getTransactions,
  getTransactionsBetween,
  getTransactionsPage,
} from "@/lib/transactions";
import {
  computeSummary,
  getPayCycleBounds,
  groupExpensesByCategory,
  type Summary,
} from "@/lib/summary";
import { getProfile } from "@/lib/profiles";
import SummaryCards from "@/components/dashboard/SummaryCards";
import LazyCategoryChart from "@/components/dashboard/LazyCategoryChart";
import TransactionTable from "@/components/dashboard/TransactionTable";
import AddTransactionModal from "@/components/dashboard/AddTransactionModal";
import ChatDrawer from "@/components/ai/ChatDrawer";

export default async function DashboardPage() {
  const [transactions, page] = await Promise.all([
    getTransactions(),
    getTransactionsPage(),
  ]);

  const profile = await getProfile();
  const payday = profile?.payday ?? null;
  const expectedIncome = profile?.expected_income ?? null;
  const isCycleEligible =
    payday !== null &&
    expectedIncome !== null &&
    (profile?.income_type === "salaried" || profile?.income_type === "hourly");
  const isFreelancer = profile?.income_type === "freelancer";

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
  } else {
    summary = computeSummary(transactions);
  }

  const categories = groupExpensesByCategory(transactions);

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
        />
        <LazyCategoryChart categories={categories} />
        <TransactionTable
          transactions={page.transactions}
          nextCursor={page.nextCursor}
        />
      </main>
    </ChatDrawer>
  );
}
