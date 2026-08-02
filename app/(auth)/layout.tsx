import { Wallet } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Wallet className="h-10 w-10 text-primary" />
          <span className="text-3xl font-bold text-base-content">BudgetIQ</span>
        </div>
        {children}
      </div>
    </main>
  );
}
