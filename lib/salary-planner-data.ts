import { SalaryPlan } from "@/types/salary-planner";
import { createClient } from "@/lib/supabase/server";

export async function getSalaryPlan(userId: string): Promise<SalaryPlan | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("salary_budget_plans")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    monthly_salary: Number(data.monthly_salary) || 0,
    has_dependents: Boolean(data.has_dependents),
    actual_essentials: Number(data.actual_essentials) || 0,
    actual_lifestyle: Number(data.actual_lifestyle) || 0,
    actual_emergency_fund: Number(data.actual_emergency_fund) || 0,
    actual_investments: Number(data.actual_investments) || 0,
    chat_messages: Array.isArray(data.chat_messages) ? data.chat_messages : [],
    ai_advice: data.ai_advice ?? null,
  };
}