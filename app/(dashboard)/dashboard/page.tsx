import { getTransactions } from "@/lib/transactions";
import { computeSummary, groupExpensesByCategory } from "@/lib/summary";
import { getDailyQuote } from "@/lib/quotes";
import SummaryCards from "@/components/dashboard/SummaryCards";
import CategoryChart from "@/components/dashboard/CategoryChart";
import TransactionTable from "@/components/dashboard/TransactionTable";
import QuoteCard from "@/components/dashboard/QuoteCard";
import ChatDrawer from "@/components/ai/ChatDrawer";

export default async function DashboardPage() {
  const transactions = await getTransactions();
  const summary = computeSummary(transactions);
  const categories = groupExpensesByCategory(transactions);
  const quote = await getDailyQuote();

  return (
    <ChatDrawer>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
        <header>
          <h1 className="text-3xl font-bold text-base-content">Dashboard</h1>
        </header>
        <QuoteCard quote={quote} />
        <SummaryCards
          summary={summary}
          hasTransactions={transactions.length > 0}
        />
        <CategoryChart categories={categories} />
        <TransactionTable transactions={transactions} />
      </main>
    </ChatDrawer>
  );
}
