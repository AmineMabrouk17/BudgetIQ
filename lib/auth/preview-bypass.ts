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

const PREVIEW_USER_ID = "preview-synthetic-user";
const PREVIEW_USER_EMAIL = "preview-bot@internal.test";
const PREVIEW_USER_NAME = "Preview Test Bot";
const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 60 * 60 * 1000;

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

  // Replay protection: reject signatures older than 5 minutes.
  const timeDiff = Math.abs(Date.now() - parseInt(timestamp, 10));
  if (isNaN(timeDiff) || timeDiff > MAX_TIMESTAMP_DRIFT_MS) return null;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
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
      role: "admin",
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