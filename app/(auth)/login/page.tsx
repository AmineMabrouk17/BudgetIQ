"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Loader2, Globe, Mail, Send } from "lucide-react";

type Mode = "signin" | "signup";
type ErrorAction = "switchToSignIn" | "switchToSignUp" | "resend" | null;

type AuthError = { code?: string; message?: string } | null;

function friendlyError(
  error: AuthError
): { message: string; action: ErrorAction } {
  const code = error?.code ?? "";
  const message = error?.message ?? "";
  const lower = message.toLowerCase();

  if (code === "user_already_exists" || lower.includes("already registered")) {
    return {
      message: "An account with this email already exists. Sign in instead.",
      action: "switchToSignIn",
    };
  }
  if (code === "invalid_credentials") {
    return { message: "Incorrect email or password.", action: null };
  }
  if (code === "email_not_confirmed") {
    return {
      message:
        "Your email isn't confirmed yet. Check your inbox (and spam) for the confirmation link.",
      action: "resend",
    };
  }
  if (code === "weak_password") {
    return {
      message: "Password is too weak — use at least 6 characters.",
      action: null,
    };
  }
  if (code === "over_email_send_rate_limit") {
    return {
      message: "Too many confirmation emails sent. Please wait a moment and try again.",
      action: null,
    };
  }
  if (lower.includes("invalid email")) {
    return { message: "Please enter a valid email address.", action: null };
  }
  return {
    message: message || "Something went wrong. Please try again.",
    action: null,
  };
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<ErrorAction>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingOAuth, setPendingOAuth] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(false);
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const supabase = createClient();

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setErrorAction(null);
    setMessage(null);
  }

  function applyError(error: AuthError) {
    const { message, action } = friendlyError(error);
    setError(message);
    setErrorAction(action);
    if (action === "switchToSignIn") {
      setMode("signin");
      setPassword("");
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setMessage(null);
    setPendingOAuth(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      applyError(error);
      setPendingOAuth(false);
    }
  }

  async function resendConfirmation() {
    setError(null);
    setMessage(null);
    setPendingEmail(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setPendingEmail(false);
    if (error) {
      applyError(error);
    } else {
      setErrorAction(null);
      setMessage(
        "Confirmation email sent. Check your inbox (and spam) to verify your account."
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrorAction(null);
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
        applyError(error);
      } else if (data.session) {
        window.location.href = "/";
      } else {
        setErrorAction("resend");
        setMessage(
          `We sent a confirmation link to ${email}. Check your inbox (and spam) to verify your account.`
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        applyError(error);
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
            onClick={() => switchMode("signin")}
          >
            Sign in
          </button>
          <button
            role="tab"
            className={`tab ${mode === "signup" ? "tab-active" : ""}`}
            onClick={() => switchMode("signup")}
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
        {errorAction === "resend" && (
          <button
            className="btn btn-ghost btn-sm mt-2"
            onClick={resendConfirmation}
            disabled={pendingEmail}
          >
            {pendingEmail ? <Loader2 className="animate-spin" /> : <Send />}
            Resend confirmation email
          </button>
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
