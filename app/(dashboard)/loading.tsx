export default function DashboardLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
      <header>
        <div className="h-8 w-48 animate-pulse rounded bg-base-300" />
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-base-300"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-base-300" />
      <div className="h-64 animate-pulse rounded-lg bg-base-300" />
    </main>
  );
}
