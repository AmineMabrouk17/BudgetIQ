import crypto from "crypto";

export interface SyntheticUserSession {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
    aud: string;
    app_metadata: Record<string, unknown>;
    user_metadata: { full_name: string; name: string; avatar_url?: string | null };
    created_at: string;
    updated_at: string;
  };
  expires: string;
}

type HeaderReader = { get(name: string): string | null };

export const PREVIEW_USER_ID = "preview-synthetic-user";
export const PREVIEW_USER_EMAIL = "preview-bot@internal.test";
export const PREVIEW_USER_NAME = "Preview Test Bot";
// Keep replay window short; preview auth is convenience-only and must remain
// isolated to Vercel preview environments with a configured secret.
const MAX_TIMESTAMP_DRIFT_MS = 2 * 60 * 1000;
const SESSION_TTL_MS = 30 * 60 * 1000;

export function getPreviewMockSession(
  headersList: HeaderReader
): SyntheticUserSession | null {
  // STRICT GUARD: only active on Vercel preview deploys (or local runs that
  // explicitly set VERCEL_ENV=preview). Always inert in production.
  if (process.env.VERCEL_ENV !== "preview") {
    return null;
  }

  const secret = process.env.PREVIEW_TEST_SECRET;
  if (!secret) return null;

  const signature = headersList.get("x-test-auth-signature");
  const timestamp = headersList.get("x-test-auth-timestamp");
  if (!signature || !timestamp) return null;

  // Replay protection: reject stale or malformed timestamps.
  const issuedAt = parseInt(timestamp, 10);
  const timeDiff = Math.abs(Date.now() - issuedAt);
  if (!Number.isFinite(issuedAt) || timeDiff > MAX_TIMESTAMP_DRIFT_MS) return null;

  // Signature covers timestamp and a fixed purpose to avoid accidental reuse
  // with unrelated HMACs over the same secret.
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`preview-auth:${timestamp}`)
    .digest("hex");

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    )
  ) {
    return null;
  }

  const now = new Date();
  return {
    user: {
      id: PREVIEW_USER_ID,
      email: PREVIEW_USER_EMAIL,
      name: PREVIEW_USER_NAME,
      role: "user",
      aud: "authenticated",
      app_metadata: {},
      user_metadata: {
        full_name: PREVIEW_USER_NAME,
        name: PREVIEW_USER_NAME,
      },
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    expires: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  };
}