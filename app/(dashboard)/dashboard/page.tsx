import { getUser } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold text-base-content">Dashboard</h1>
      <p className="text-base-content/70">
        Signed in as {user?.email ?? "a BudgetIQ user"}
      </p>
    </main>
  );
}
