/**
 * Placeholders streamed ahead of the dashboard's data.
 *
 * Each skeleton mirrors the box model of the component it stands in for, so
 * swapping the fallback for the real content does not reflow the page
 * (Cumulative Layout Shift) and the surrounding layout does not jump.
 */

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-base-300 ${className}`} />;
}

export function SummaryCardsSkeleton() {
  return (
    <section aria-label="Financial summary" aria-busy="true">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-base-content">
          Financial Summary
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="stat rounded-box bg-base-100 shadow">
            <div className="stat-figure">
              <Bar className="h-8 w-8" />
            </div>
            <div className="stat-title">
              <Bar className="h-3 w-20" />
            </div>
            <div className="stat-value text-2xl">
              <Bar className="h-6 w-28" />
            </div>
            <div className="stat-desc">
              <Bar className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Analytics"
      className="card w-full bg-base-100 shadow"
    >
      <div className="card-body">
        <Bar className="h-6 w-40" />
        <Bar className="h-72 w-full" />
      </div>
    </div>
  );
}

export function TransactionTableSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Transactions"
      className="card w-full overflow-hidden border border-base-content/10 bg-base-100 shadow-sm"
    >
      <div className="border-b border-base-content/5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Bar className="h-4 w-40" />
            <Bar className="h-3 w-56" />
          </div>
          <div className="flex items-center gap-2.5">
            <Bar className="h-8 w-72 rounded-full" />
            <Bar className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="space-y-3 p-5 sm:p-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Bar className="h-8 w-8 rounded-full" />
            <Bar className="h-3 flex-1" />
            <Bar className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}