import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session_token";

/**
 * Whether the request carries a valid admin session.
 *
 * The layout calls this to decide whether to show the Admin nav item, and it
 * runs before any HTML is flushed — so the answer has to come from something
 * the request already carries. The session is a cookie set at sign-in, making
 * this a pure in-memory read with no database or Auth API round-trip.
 *
 * `verifyAdminSession()` in `app/actions/admin.ts` stays the check the admin
 * routes use to guard their own data access; this is the optimistic,
 * display-only read the layout needs.
 */
export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === "authenticated";
}
