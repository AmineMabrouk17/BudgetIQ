"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  INCOME_TYPES,
  updateIncomeProfileInDb,
  type IncomeType,
} from "@/lib/profiles";
import { seedDefaultKpis } from "@/lib/kpi";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}