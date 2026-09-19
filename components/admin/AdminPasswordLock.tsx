"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2, Lock, ShieldAlert } from "lucide-react";
import { authenticateAdmin } from "@/app/actions/admin";

export default function AdminPasswordLock() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      setError(null);
      const result = await authenticateAdmin(formData);
      if (!result.ok) {
        setError(result.error ?? "Authentication failed");
      }
    });
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="card w-full max-w-sm border border-base-content/10 bg-base-100 shadow-xl">
        <div className="card-body items-center p-8 text-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary mb-2 ring-8 ring-primary/5">
            <Lock className="h-7 w-7" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-base-content">
            Admin Access
          </h2>
          <p className="text-xs text-base-content/60">
            This section contains platform user data. Please enter the master password to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 w-full space-y-3">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-error/10 p-2.5 text-xs font-medium text-error">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
              <input
                type="password"
                name="password"
                placeholder="Enter password..."
                required
                autoFocus
                className="input input-bordered input-sm w-full rounded-lg pl-9 pr-3 text-xs focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary btn-sm w-full rounded-lg"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Unlock Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}