"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-4 p-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <span className="text-4xl text-error">
          <AlertTriangle />
        </span>
        <h2 className="text-xl font-bold text-base-content">
          Something went wrong
        </h2>
        <p className="text-sm text-base-content/70">
          We couldn&apos;t load your dashboard. Please try again.
        </p>
        <button className="btn btn-primary" onClick={() => unstable_retry()}>
          <RefreshCw />
          Try again
        </button>
      </div>
    </main>
  );
}
