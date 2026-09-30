import { cache } from "react";
import { createClient, getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const INCOME_TYPES = [
  "salaried",
  "hourly",
  "freelancer",
  "business",
] as const;

export type IncomeType = (typeof INCOME_TYPES)[number];

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  income_type: IncomeType | null;
  payday: number | null;
  expected_income: number | null;
};

export function needsOnboarding(
  profile: Pick<Profile, "income_type"> | null
): boolean {
  return !profile?.income_type;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, income_type, payday, expected_income"
    )
    .order("created_at", { ascending: false });

  return data ?? [];
}

async function fetchProfile(): Promise<Profile | null> {
  // Reuses the request-scoped session memo rather than hitting the Auth API a
  // second time: callers already resolved `getUser()` for the auth redirect.
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, income_type, payday, expected_income"
    )
    .eq("id", user.id)
    .maybeSingle();

  return profile ?? null;
}

/**
 * Request-scoped memo of the profile lookup.
 *
 * The dashboard layout reads the profile for its onboarding redirect and the
 * dashboard page reads it again for pay-cycle maths. Memoising keeps that a
 * single query per request no matter how many components ask, and stops the
 * second reader from blocking on a round-trip the first one already paid for.
 */
export const getProfile = cache(fetchProfile);

export type UpdateIncomeProfileInput = {
  income_type: IncomeType;
  payday?: number | null;
  expected_income?: number | null;
};

export async function updateIncomeProfileInDb(
  userId: string,
  input: UpdateIncomeProfileInput
): Promise<Profile> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { income_type: input.income_type };
  if (input.payday !== undefined) updates.payday = input.payday;
  if (input.expected_income !== undefined)
    updates.expected_income = input.expected_income;
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select(
      "id, email, full_name, avatar_url, income_type, payday, expected_income"
    )
    .single();

  if (error) throw error;
  return data;
}