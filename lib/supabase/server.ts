import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
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

export async function getUser() {
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
