import { BudgetTargets, SalaryPlan } from "@/types/salary-planner";
import { createClient } from "@/lib/supabase/server";

export function computeBudgetTargets(salary: number, hasDependents: boolean): BudgetTargets {
  const safeSalary = Math.max(0, salary);
  const maxEssentials = safeSalary * 0.6;
  const maxLifestyle = safeSalary * 0.2;

  // Emergency fund target based on essentials (3-6 months, or 12 months for breadwinners)
  const targetEmergencyFundMin = maxEssentials * 3;
  const targetEmergencyFundMax = hasDependents ? maxEssentials * 12 : maxEssentials * 6;

  const targetInvestmentMin = safeSalary * 0.1;
  const targetInvestmentIdeal = safeSalary * 0.2;

  return {
    salary: safeSalary,
    hasDependents,
    maxEssentials,
    maxLifestyle,
    targetEmergencyFundMin,
    targetEmergencyFundMax,
    targetInvestmentMin,
    targetInvestmentIdeal,
  };
}

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