"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { verifyTurnstile } from "@/app/actions/auth";
import { Loader2, Globe, Mail, Send } from "lucide-react";

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type Mode = "signin" | "signup";
type ErrorAction = "switchToSignIn" | "switchToSignUp" | "resend" | null;

type AuthError = { code?: string; message?: string; status?: number } | null;

function friendlyError(
  error: AuthError
): { message: string; action: ErrorAction } {
  const code = error?.code ?? "";
  const message = error?.message ?? "";
  const status = error?.status ?? 0;
  const lower = message.toLowerCase();

  if (status >= 500 || message === "{}" || message.trim() === "") {
    return {
      message: "Something went wrong on our end. Please try again in a moment.",
      action: null,
    };
  }

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
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | undefined>(undefined);
  const turnstileTokenRef = useRef<string | null>(null);
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const supabase = createClient();

  useEffect(() => {
    if (!turnstileSiteKey) return;

    const siteKey: string = turnstileSiteKey;
    const container = turnstileContainerRef.current;
    if (!container) return;

    const widgetTarget: HTMLElement = container;

    let cancelled = false;
    turnstileTokenRef.current = null;

    function renderWidget() {
      if (cancelled || !window.turnstile) return;
      if (turnstileWidgetId.current) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
        } catch {
          // The widget may already be gone (e.g. tab switch); render a fresh one.
        }
        turnstileWidgetId.current = undefined;
      }
      turnstileWidgetId.current = window.turnstile.render(widgetTarget, {
        sitekey: siteKey,
        action: "turnstile-spin-v2",
        callback: (token) => {
          turnstileTokenRef.current = token;
        },
        "expired-callback": () => {
          turnstileTokenRef.current = null;
        },
      });
    }

    function loadScript() {
      if (window.turnstile) {
        renderWidget();
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${TURNSTILE_SCRIPT_URL}"]`
      );
      if (existing) {
        existing.addEventListener("load", renderWidget, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderWidget, { once: true });
      document.head.appendChild(script);
    }

    loadScript();

    return () => {
      cancelled = true;
      if (turnstileWidgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
        } catch {
          // ignore
        }
        turnstileWidgetId.current = undefined;
      }
    };
  }, [mode]);

  function resetTurnstile() {
    turnstileTokenRef.current = null;
    if (turnstileWidgetId.current && window.turnstile) {
      try {
        window.turnstile.reset(turnstileWidgetId.current);
      } catch {
        // ignore
      }
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setErrorAction(null);
    setMessage(null);
    resetTurnstile();
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

    const turnstileTokenValue = turnstileTokenRef.current;
    if (!turnstileTokenValue) {
      setError("Please complete the security check before submitting.");
      resetTurnstile();
      return;
    }

    setPendingEmail(true);

    const verification = await verifyTurnstile(turnstileTokenValue);
    if (!verification.ok) {
      setError(verification.error);
      resetTurnstile();
      setPendingEmail(false);
      return;
    }

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
        window.location.href = "/dashboard";
      } else if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        applyError({
          code: "user_already_exists",
          message: "User already registered",
        });
      } else {
        setErrorAction("resend");
        setMessage(
          `We sent a confirmation link to ${email}. Check your inbox (and spam) to verify your account.`
        );
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        applyError(error);
      } else if (data.session) {
        window.location.href = "/dashboard";
      } else {
        applyError({
          code: "invalid_credentials",
          message:
            "We couldn't sign you in. Your email may not be confirmed yet — check your inbox (and spam) for the confirmation link.",
        });
      }
    }

    setPendingEmail(false);
    resetTurnstile();
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
          {turnstileSiteKey && (
            <div
              key={mode}
              ref={turnstileContainerRef}
              className="mt-1 flex min-h-[65px] justify-center"
            />
          )}
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
