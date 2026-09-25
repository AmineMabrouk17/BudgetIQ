import { NextRequest, NextResponse } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";
import { askBudgetAdvisor } from "@/lib/gemini";
import { LlmError } from "@/lib/llm";
import { mergeBucketActuals, sanitizeSalary } from "@/lib/salary-planner";
import { rateLimit } from "@/lib/rate-limit";
import type { BucketActuals, PlannerChatMessage } from "@/types/salary-planner";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 1000;

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
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message, plan } = (body ?? {}) as {
    message?: unknown;
    plan?: Record<string, unknown>;
  };

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Message is too long" }, { status: 413 });
  }

  const supabase = await createClient();

  // Retrieve current plan
  const { data: dbPlan } = await supabase
    .from("salary_budget_plans")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentSalary = numberOr(plan?.monthly_salary) ?? numberOr(dbPlan?.monthly_salary) ?? 0;
  const currentDependents =
    plan?.has_dependents ?? dbPlan?.has_dependents ?? false;
  const currentActuals: BucketActuals = {
    essentials: numberOr(plan?.actual_essentials) ?? numberOr(dbPlan?.actual_essentials) ?? 0,
    lifestyle: numberOr(plan?.actual_lifestyle) ?? numberOr(dbPlan?.actual_lifestyle) ?? 0,
    emergencyFund:
      numberOr(plan?.actual_emergency_fund) ?? numberOr(dbPlan?.actual_emergency_fund) ?? 0,
    investments:
      numberOr(plan?.actual_investments) ?? numberOr(dbPlan?.actual_investments) ?? 0,
  };

  const existingHistory: PlannerChatMessage[] = Array.isArray(dbPlan?.chat_messages)
    ? dbPlan.chat_messages
    : [];

  let advisorResponse;
  try {
    advisorResponse = await askBudgetAdvisor({
      userInput: message.trim(),
      monthlySalary: currentSalary,
      hasDependents: Boolean(currentDependents),
      actuals: currentActuals,
      history: existingHistory.map((m) => ({ role: m.role, text: m.text })),
    });
  } catch (error) {
    console.error("Budget advisor call failed:", error);

    if (error instanceof LlmError) {
      return NextResponse.json(
        { error: advisorErrorMessage(error) },
        { status: error.kind === "quota" ? 429 : 502 }
      );
    }

    return NextResponse.json(
      { error: "The AI advisor is unavailable right now. Please try again." },
      { status: 502 }
    );
  }

  // A stated salary wins over the stored one; buckets come from summing the
  // line items the model extracted, never from a value it asserts wholesale.
  const updatedSalary = sanitizeSalary(
    advisorResponse.monthlySalary,
    currentSalary
  );
  const merged = mergeBucketActuals(
    currentActuals,
    advisorResponse.lineItems,
    advisorResponse.replaceActuals ?? false
  );

  const updatedActuals = {
    actual_essentials: merged.essentials,
    actual_lifestyle: merged.lifestyle,
    actual_emergency_fund: merged.emergencyFund,
    actual_investments: merged.investments,
  };

  const now = new Date().toISOString();
  const newUserMsg: PlannerChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    text: message.trim(),
    timestamp: now,
  };

  const newAssistantMsg: PlannerChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    text: advisorResponse.message,
    timestamp: now,
  };

  const updatedMessages = [...existingHistory, newUserMsg, newAssistantMsg];
  const aiAdvice = advisorResponse.adviceSummary ?? dbPlan?.ai_advice ?? null;

  // Persist conversation and values to Supabase
  const { error: persistError } = await supabase
    .from("salary_budget_plans")
    .upsert(
      {
        user_id: user.id,
        monthly_salary: updatedSalary,
        has_dependents: currentDependents,
        ...updatedActuals,
        chat_messages: updatedMessages,
        ai_advice: aiAdvice,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

  if (persistError) {
    console.error("Failed to persist salary plan:", persistError);
  }

  return NextResponse.json({
    message: advisorResponse.message,
    adviceSummary: advisorResponse.adviceSummary,
    updatedSalary,
    updatedActuals,
    messages: updatedMessages,
  });
}

function numberOr(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function advisorErrorMessage(error: LlmError): string {
  switch (error.kind) {
    case "quota":
      return /per day|daily|request limit/i.test(error.detail ?? "")
        ? "The AI advisor has hit its daily request limit. It will be available again tomorrow."
        : "The AI advisor is receiving too many requests right now. Please try again in a minute.";
    case "overloaded":
      return "The AI advisor is busy right now. Please try again in a moment.";
    case "config":
      return "The AI advisor is not available on this server right now.";
    default:
      return "The AI advisor could not process that. Please try rephrasing.";
  }
}
