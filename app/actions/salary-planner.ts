"use server";

import { getUser, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSalaryPlanAction(formData: {
  monthly_salary: number;
  has_dependents: boolean;
  actual_essentials: number;
  actual_lifestyle: number;
  actual_emergency_fund: number;
  actual_investments: number;
}) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { error } = await supabase.from("salary_budget_plans").upsert(
    {
      user_id: user.id,
      monthly_salary: formData.monthly_salary,
      has_dependents: formData.has_dependents,
      actual_essentials: formData.actual_essentials,
      actual_lifestyle: formData.actual_lifestyle,
      actual_emergency_fund: formData.actual_emergency_fund,
      actual_investments: formData.actual_investments,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Failed to save salary plan:", error);
    throw new Error("Failed to save plan");
  }

  revalidatePath("/salary-planner");
  return { success: true };
}

export async function clearAdvisorChatAction() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createClient();
  await supabase
    .from("salary_budget_plans")
    .update({ chat_messages: [], ai_advice: null })
    .eq("user_id", user.id);

  revalidatePath("/salary-planner");
}