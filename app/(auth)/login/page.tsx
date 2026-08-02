"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Loader2, Globe, Mail } from "lucide-react";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingOAuth, setPendingOAuth] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(false);
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const supabase = createClient();

  async function signInWithGoogle() {
    setError(null);
    setMessage(null);
    setPendingOAuth(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setPendingOAuth(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPendingEmail(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: `${firstName.trim()} ${lastName.trim()}`.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        window.location.href = "/";
      } else {
        setMessage(
          "Check your inbox for a verification email to confirm your account."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = "/";
      }
    }

    setPendingEmail(false);
  }

  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title justify-center text-2xl">Sign in to BudgetIQ</h2>
        <p className="text-center text-sm text-base-content/70">
          Track your income, expenses, and assets.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <button
            className="btn btn-outline"
            onClick={signInWithGoogle}
            disabled={pendingOAuth || pendingEmail}
          >
            {pendingOAuth ? <Loader2 className="animate-spin" /> : <Globe />}
            Continue with Google
          </button>
        </div>

        <div className="divider my-4">or</div>

        <div role="tablist" className="tabs tabs-lift">
          <button
            role="tab"
            className={`tab ${mode === "signin" ? "tab-active" : ""}`}
            onClick={() => {
              setMode("signin");
              setError(null);
              setMessage(null);
            }}
          >
            Sign in
          </button>
          <button
            role="tab"
            className={`tab ${mode === "signup" ? "tab-active" : ""}`}
            onClick={() => {
              setMode("signup");
              setError(null);
              setMessage(null);
            }}
          >
            Create account
          </button>
        </div>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="flex gap-3">
              <label className="form-control w-full">
                <span className="label-text mb-1">First name</span>
                <input
                  className="input input-bordered w-full"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Last name</span>
                <input
                  className="input input-bordered w-full"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </label>
            </div>
          )}
          <label className="form-control w-full">
            <span className="label-text mb-1">Email</span>
            <input
              className="input input-bordered w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1">Password</span>
            <input
              className="input input-bordered w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </label>
          <button
            className="btn btn-primary mt-2"
            disabled={pendingEmail || pendingOAuth}
          >
            {pendingEmail ? <Loader2 className="animate-spin" /> : <Mail />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {callbackError && (
          <div className="alert alert-error mt-4">
            <span>Sign-in failed. Please try again.</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="alert alert-success mt-4">
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
