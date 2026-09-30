import { Suspense } from "react";
import type { TransactionScopeFilter } from "@/lib/transactions";
import ScopeFilter from "@/components/dashboard/ScopeFilter";
import AddTransactionModal from "@/components/dashboard/AddTransactionModal";
import ChatDrawer from "@/components/ai/ChatDrawer";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";
import DashboardTransactions from "@/components/dashboard/DashboardTransactions";
import {
  AnalyticsSkeleton,
  SummaryCardsSkeleton,
  TransactionTableSkeleton,
} from "@/components/dashboard/DashboardSkeletons";

function parseScope(
  raw: string | string[] | undefined
): TransactionScopeFilter {
  return raw === "business" || raw === "personal" ? raw : null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const scope = parseScope((await searchParams).scope);

  // No data is awaited here on purpose. The heading, filters and skeletons are
  // the shell, and each section streams in behind its own boundary as its
  // queries resolve — so the document is flushed before the transaction reads
  // finish instead of waiting on all of them.
  return (
    <ChatDrawer>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-base-content">Dashboard</h1>
          <AddTransactionModal />
        </header>
        <Suspense fallback={<SummaryCardsSkeleton />}>
          <DashboardSummary />
        </Suspense>
        <div className="flex items-center justify-end">
          <ScopeFilter scope={scope} />
        </div>
        <Suspense fallback={<AnalyticsSkeleton />}>
          <DashboardAnalytics />
        </Suspense>
        <Suspense fallback={<TransactionTableSkeleton />}>
          <DashboardTransactions scope={scope} />
        </Suspense>
      </main>
    </ChatDrawer>
  );
}
