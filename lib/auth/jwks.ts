import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A process-wide cache of the Supabase project's JSON Web Key Set.
 *
 * `supabase.auth.getClaims()` verifies a JWT signature locally, but it keeps
 * the JWKS it downloads on the *auth client instance*. This app builds a fresh
 * client per request (it has to — the client is bound to the request's
 * cookies), so relying on that cache would mean an HTTPS round-trip to
 * `/.well-known/jwks.json` on every single request and no local verification
 * benefit at all.
 *
 * Hoisting the key set into module scope makes the fetch happen once per
 * process instead of once per request. Supabase signs with rotating
 * asymmetric keys, so the `kid` is used as the cache key: a token signed with
 * a key we have not seen triggers exactly one refetch, and after that the
 * signature is checked with `crypto.subtle` and no network at all.
 *
 * Sharing module state across requests is safe here precisely because a cache
 * miss costs a refetch and never a wrong answer — a stale key can only make
 * verification fail, never silently pass. It also holds on platforms where the
 * module scope is not reused between invocations (Lambda, CDN isolates): the
 * worst case is one extra request for a set that is CDN-cached upstream.
 */

const JWKS_TTL_MS = 60 * 60 * 1000;

/**
 * Derived from `auth.getClaims()`'s own signature so the key set stays
 * structurally compatible with whatever key shape the library expects.
 */
type ClaimsOptions = NonNullable<
  Parameters<SupabaseClient["auth"]["getClaims"]>[1]
>;

export type Jwks = NonNullable<ClaimsOptions["jwks"]>;

type CacheEntry = {
  jwks: Jwks;
  fetchedAt: number;
};

let cache: CacheEntry | null = null;
let inFlight: Promise<Jwks> | null = null;

function isFresh(entry: CacheEntry, kid: string | undefined): boolean {
  if (Date.now() - entry.fetchedAt >= JWKS_TTL_MS) return false;
  // A rotated key is a cache miss even inside the TTL. Matching on `kid` alone
  // would let a token signed by an unknown key pass, so the key itself has to
  // be present in the set we are about to verify against.
  if (!kid) return false;
  return entry.jwks.keys.some((key) => key.kid === kid);
}

async function fetchJwks(supabaseUrl: string): Promise<Jwks> {
  const response = await fetch(
    `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/.well-known/jwks.json`,
    { headers: { Accept: "application/json" } }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Supabase JWKS: ${response.status} ${response.statusText}`
    );
  }
  const jwks = (await response.json()) as Jwks;
  if (!Array.isArray(jwks?.keys) || jwks.keys.length === 0) {
    throw new Error("Supabase JWKS response contained no keys");
  }
  return jwks;
}

/**
 * Returns the project's key set, containing `kid`, downloading it only when
 * the cached copy is missing, stale, or predates a key rotation.
 *
 * Throws when the key set cannot be retrieved so callers can fall back to the
 * Auth API rather than treating an unverifiable token as trustworthy.
 */
export async function getJwks(
  supabaseUrl: string,
  kid: string | undefined
): Promise<Jwks> {
  if (cache && isFresh(cache, kid)) return cache.jwks;

  // Concurrent lookups (several components verifying at once during a render)
  // share one download instead of stampeding the endpoint.
  inFlight ??= fetchJwks(supabaseUrl)
    .then((jwks) => {
      cache = { jwks, fetchedAt: Date.now() };
      return jwks;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Test seam: drops the cached key set so the next lookup refetches. */
export function __resetJwksCache(): void {
  cache = null;
  inFlight = null;
}
