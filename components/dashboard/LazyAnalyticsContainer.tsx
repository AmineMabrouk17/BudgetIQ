"use client";

import dynamic from "next/dynamic";
import type { Transaction } from "@/types/transaction";

const AnalyticsContainer = dynamic(
  () => import("@/components/dashboard/AnalyticsContainer"),
  {
    ssr: false,
    loading: () => (
      <div className="card w-full bg-base-100 shadow">
        <div className="card-body">
          <div className="h-6 w-40 animate-pulse rounded bg-base-300" />
          <div className="h-72 w-full animate-pulse rounded bg-base-300" />
        </div>
      </div>
    ),
  }
);

export default function LazyAnalyticsContainer({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return <AnalyticsContainer transactions={transactions} />;
}
