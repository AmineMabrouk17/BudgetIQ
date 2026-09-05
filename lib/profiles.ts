import { createClient } from "@/lib/supabase/server";

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

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, income_type, payday, expected_income"
    )
    .eq("id", user.id)
    .maybeSingle();

  return profile ?? null;
}

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