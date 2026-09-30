"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import {
  INCOME_TYPES,
  updateIncomeProfileInDb,
  type IncomeType,
} from "@/lib/profiles";
import { seedDefaultKpis } from "@/lib/kpi";

/**
 * Records onboarding completion in `user_metadata`, so the flag rides along in
 * the user's access token and the dashboard layout can gate on it without
 * reading `profiles`.
 *
 * `updateUser` reissues the session, so the refreshed cookie carries the new
 * metadata on the very next navigation. A failure here is deliberately
 * non-fatal: the profile row is already written, so onboarding still succeeded
 * and the layout falls back to the database for anyone flagged later by the
 * backfill migration.
 */
async function markOnboarded(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { onboarded: true },
  });
  if (error) {
    console.error("Failed to mark user onboarded:", error.message);
  }
}

export type UpdateIncomeProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateIncomeProfile(
  incomeType: IncomeType,
  options: {
    payday?: number | null;
    expected_income?: number | null;
  } = {}
): Promise<UpdateIncomeProfileResult> {
  if (!INCOME_TYPES.includes(incomeType)) {
    return { ok: false, error: "Invalid income type." };
  }

  const { payday, expected_income } = options;
  if (
    payday !== undefined &&
    payday !== null &&
    (!Number.isInteger(payday) || payday < 1 || payday > 31)
  ) {
    return { ok: false, error: "Payday must be between 1 and 31." };
  }
  if (
    expected_income !== undefined &&
    expected_income !== null &&
    (!Number.isFinite(expected_income) || expected_income <= 0)
  ) {
    return { ok: false, error: "Expected income must be positive." };
  }

  const supabase = await createClient();
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated." };
  }

  try {
    await updateIncomeProfileInDb(user.id, {
      income_type: incomeType,
      ...(payday !== undefined && { payday }),
      ...(expected_income !== undefined && { expected_income }),
    });
    await seedDefaultKpis(user.id);
    await markOnboarded(supabase);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}