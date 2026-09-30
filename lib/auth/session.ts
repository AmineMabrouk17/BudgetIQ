import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getJwks } from "@/lib/auth/jwks";
import { env } from "@/lib/env";

/**
 * The subset of a Supabase user the app actually reads.
 *
 * The access token carries the claims below and nothing else useful here, so
 * a verified token is a complete substitute for the user object that
 * `auth.getUser()` fetches over the network.
 */
export type SessionUser = {
  id: string;
  email: string | null;
  user_metadata: User["user_metadata"];
  app_metadata: User["app_metadata"];
};

type JwtHeader = {
  alg?: string;
  kid?: string;
};

/** Decodes the JOSE header so we know which signing key to verify against. */
function decodeHeader(token: string): JwtHeader | null {
  const [encodedHeader] = token.split(".");
  if (!encodedHeader) return null;
  try {
    const json = Buffer.from(encodedHeader, "base64url").toString("utf8");
    const header = JSON.parse(json) as JwtHeader;
    return typeof header === "object" && header !== null ? header : null;
  } catch {
    return null;
  }
}

function toSessionUser(claims: Record<string, unknown>): SessionUser | null {
  const id = claims.sub;
  if (typeof id !== "string" || id === "") return null;

  return {
    id,
    email: typeof claims.email === "string" ? claims.email : null,
    user_metadata: (claims.user_metadata ?? {}) as User["user_metadata"],
    app_metadata: (claims.app_metadata ?? {}) as User["app_metadata"],
  };
}

/**
 * Resolves the signed-in user without asking the Auth API who they are.
 *
 * `auth.getUser()` round-trips to `/auth/v1/user` on every call, which made
 * the dashboard shell wait on the network before it could flush a single byte
 * of HTML. The access token in the request cookie is already a signed JWT, so
 * verifying it against the project's JWKS answers the same question locally.
 *
 * The network is still the fallback, and it is used for every case local
 * verification cannot cover:
 *
 * - the token is missing, malformed, or signed by a key we do not hold;
 * - the signature does not verify (tampered token);
 * - the project signs symmetrically (HS*), where verification needs the shared
 *   JWT secret rather than a public key;
 * - the token has expired but the refresh token is still good, in which case
 *   `getUser()` performs the refresh and the caller gets a live session.
 *
 * Falling back rather than failing closed is deliberate: a false negative
 * would bounce signed-in users to `/login` on a transient JWKS outage, while
 * the Auth API remains the authority on whether a token is genuinely valid.
 */
export async function readSessionUser(
  supabase: SupabaseClient
): Promise<SessionUser | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return null;

  const header = decodeHeader(token);
  const symmetric = !header?.alg || header.alg.startsWith("HS");

  if (header && !symmetric) {
    try {
      const jwks = await getJwks(env.NEXT_PUBLIC_SUPABASE_URL, header.kid);
      const { data, error } = await supabase.auth.getClaims(token, { jwks });
      if (!error && data) return toSessionUser(data.claims);
    } catch {
      // Key set unreachable — fall through to the Auth API below.
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    user_metadata: user.user_metadata,
    app_metadata: user.app_metadata,
  };
}
