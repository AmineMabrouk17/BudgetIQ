import { Metadata } from "next";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSalaryPlan } from "@/lib/salary-planner";
import SalaryPlannerView from "@/components/salary-planner/SalaryPlannerView";

export const metadata: Metadata = {
  title: "Salary & Budget Planner | BudgetIQ",
  description: "Plan your salary across the 4 key financial pillars with AI guidance",
};

export default async function SalaryPlannerPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const plan = await getSalaryPlan(user.id);

  const defaultPlan = plan ?? {
    monthly_salary: 0,
    has_dependents: false,
    actual_essentials: 0,
    actual_lifestyle: 0,
    actual_emergency_fund: 0,
    actual_investments: 0,
    chat_messages: [],
    ai_advice: null,
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <SalaryPlannerView initialPlan={defaultPlan} />
    </div>
  );
}