import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { env } from "@/lib/env";
import { getPreviewMockSession } from "@/lib/auth/preview-bypass";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component; the middleware should refresh the session.
          }
        },
      },
    }
  );
}

async function fetchUser() {
  // Preview QA bypass: a signed synthetic session short-circuits the Supabase
  // session so the app renders authenticated pages without real credentials.
  // Inert unless a valid HMAC header is present on preview environments.
  const mock = getPreviewMockSession(await headers());
  if (mock) return mock.user;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Request-scoped memo of the Supabase session lookup.
 *
 * `supabase.auth.getUser()` validates the session against the Supabase Auth API,
 * so every call is a network round-trip. Layouts, pages and data loaders all
 * need the same user, and without memoisation they each pay for it again —
 * serially, because every consumer awaits the result before starting its own
 * work. `cache()` scopes the memo to a single server request: concurrent
 * consumers share one lookup, and nothing is ever shared across requests.
 *
 * Outside a React render (unit tests, scripts) there is no request scope, so
 * React falls back to invoking the function directly — behaviour is unchanged.
 */
export const getUser = cache(fetchUser);
