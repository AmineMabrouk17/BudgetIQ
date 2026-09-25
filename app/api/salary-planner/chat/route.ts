import { NextRequest, NextResponse } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";
import { askBudgetAdvisor } from "@/lib/gemini";
import { rateLimit } from "@/lib/rate-limit";
import type { PlannerChatMessage } from "@/types/salary-planner";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = await rateLimit({
    prefix: "planner_chat",
    identifier: user.id,
    limit: 25,
    window: 60,
  });

  if (!rate.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const { message, plan } = body;

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Retrieve current plan
  const { data: dbPlan } = await supabase
    .from("salary_budget_plans")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentSalary = plan?.monthly_salary ?? dbPlan?.monthly_salary ?? 0;
  const currentDependents = plan?.has_dependents ?? dbPlan?.has_dependents ?? false;
  const currentActuals = {
    essentials: plan?.actual_essentials ?? dbPlan?.actual_essentials ?? 0,
    lifestyle: plan?.actual_lifestyle ?? dbPlan?.actual_lifestyle ?? 0,
    emergencyFund: plan?.actual_emergency_fund ?? dbPlan?.actual_emergency_fund ?? 0,
    investments: plan?.actual_investments ?? dbPlan?.actual_investments ?? 0,
  };

  const existingHistory: PlannerChatMessage[] = Array.isArray(dbPlan?.chat_messages)
    ? dbPlan.chat_messages
    : [];

  const advisorResponse = await askBudgetAdvisor({
    userInput: message,
    monthlySalary: currentSalary,
    hasDependents: currentDependents,
    actuals: currentActuals,
    history: existingHistory.map((m) => ({ role: m.role, text: m.text })),
  });

  // Calculate merged actuals
  const updatedActuals = {
    actual_essentials:
      advisorResponse.extractedActuals?.essentials ?? currentActuals.essentials,
    actual_lifestyle:
      advisorResponse.extractedActuals?.lifestyle ?? currentActuals.lifestyle,
    actual_emergency_fund:
      advisorResponse.extractedActuals?.emergencyFund ?? currentActuals.emergencyFund,
    actual_investments:
      advisorResponse.extractedActuals?.investments ?? currentActuals.investments,
  };

  const newUserMsg: PlannerChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    text: message,
    timestamp: new Date().toISOString(),
  };

  const newAssistantMsg: PlannerChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    text: advisorResponse.message,
    timestamp: new Date().toISOString(),
  };

  const updatedMessages = [...existingHistory, newUserMsg, newAssistantMsg];

  // Persist conversation and values to Supabase
  await supabase.from("salary_budget_plans").upsert(
    {
      user_id: user.id,
      monthly_salary: currentSalary,
      has_dependents: currentDependents,
      ...updatedActuals,
      chat_messages: updatedMessages,
      ai_advice: advisorResponse.adviceSummary ?? dbPlan?.ai_advice ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({
    message: advisorResponse.message,
    adviceSummary: advisorResponse.adviceSummary,
    updatedActuals,
    messages: updatedMessages,
  });
}