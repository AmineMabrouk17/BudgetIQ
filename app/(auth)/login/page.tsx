"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Loader2, MessageCircle, Globe } from "lucide-react";

type Provider = "google" | "discord";

const providers: { id: Provider; label: string; icon: typeof Globe }[] = [
  { id: "google", label: "Continue with Google", icon: Globe },
  { id: "discord", label: "Continue with Discord", icon: MessageCircle },
];

export default function LoginPage() {
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
  const [, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  function signIn(provider: Provider) {
    const supabase = createClient();
    setPendingProvider(provider);
    startTransition(async () => {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setPendingProvider(null);
    });
  }

  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title justify-center text-2xl">Sign in to BudgetIQ</h2>
        <p className="text-center text-sm text-base-content/70">
          Track your income, expenses, and assets with one-click sign-in.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {providers.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className="btn btn-outline"
              onClick={() => signIn(id)}
              disabled={pendingProvider !== null}
            >
              {pendingProvider === id ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Icon />
              )}
              {label}
            </button>
          ))}
        </div>
        {error && (
          <div className="alert alert-error mt-4">
            <span>Sign-in failed. Please try again.</span>
          </div>
        )}
      </div>
    </div>
  );
}
