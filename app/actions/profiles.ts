"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  INCOME_TYPES,
  updateIncomeProfileInDb,
  type IncomeType,
} from "@/lib/profiles";

export type UpdateIncomeProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateIncomeProfile(
  incomeType: IncomeType
): Promise<UpdateIncomeProfileResult> {
  if (!INCOME_TYPES.includes(incomeType)) {
    return { ok: false, error: "Invalid income type." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated." };
  }

  try {
    await updateIncomeProfileInDb(user.id, { income_type: incomeType });
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}