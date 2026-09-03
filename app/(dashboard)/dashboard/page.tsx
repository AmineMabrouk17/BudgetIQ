import { getTransactions, getTransactionsPage } from "@/lib/transactions";
import { computeSummary, groupExpensesByCategory } from "@/lib/summary";
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
  const summary = computeSummary(transactions);
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
