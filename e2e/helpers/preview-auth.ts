import crypto from "node:crypto";

/**
 * Signed headers that make the app treat a request as the demo user.
 *
 * Matches `lib/auth/preview-bypass.ts`: the timestamp is the signed payload
 * and is only accepted inside a five-minute window, so tests compute a fresh
 * header set right before they navigate.
 */
export function previewAuthHeaders(): Record<string, string> {
  const secret = process.env.PREVIEW_TEST_SECRET ?? "local-preview-secret";
  const timestamp = String(Date.now());
  const signature = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");

  return {
    "x-test-auth-signature": signature,
    "x-test-auth-timestamp": timestamp,
  };
}
