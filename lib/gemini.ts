import { z } from "zod";
import type { BudgetAdvisorResponse } from "@/types/salary-planner";

const INTERACTIONS_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

const MODEL = "gemini-3.6-flash";

export type TransactionActionType = "income" | "expense" | "asset";

export type ParsedTransactionAction = {
  type: TransactionActionType;
  title: string;
  amount: number;
  category?: string;
};

export type ChatActionResponse = {
  message: string;
  hasAction: boolean;
  transaction?: ParsedTransactionAction;
};

export type GeminiErrorStatus = number;

export class GeminiApiError extends Error {
  readonly status: number;

  constructor(status: number, message?: string) {
    super(message ?? `Gemini API error: ${status}`);
    this.name = "GeminiApiError";
    this.status = status;
  }
}

const TRANSACTION_TYPES = [
  "income",
  "expense",
  "asset",
] as const satisfies readonly TransactionActionType[];

const INVALID_AMOUNT = "Gemini response has an invalid transaction amount";

const strictAmount = z
  .union([z.number(), z.string()])
  .transform((value, ctx): number => {
    const text = typeof value === "number" ? String(value) : value.trim();
    if (!/^\d+(\.\d+)?$/.test(text)) {
      ctx.addIssue({ code: "custom", message: INVALID_AMOUNT });
      return z.NEVER;
    }
    const amount = Number(text);
    if (!Number.isFinite(amount) || amount <= 0) {
      ctx.addIssue({ code: "custom", message: INVALID_AMOUNT });
      return z.NEVER;
    }
    return amount;
  });

const envelopeSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, { message: "Gemini response is missing a message" }),
  hasAction: z.boolean(),
  transaction: z
    .object({
      type: z.enum(TRANSACTION_TYPES, {
        message: "Gemini response has an invalid transaction type",
      }),
      title: z
        .string()
        .trim()
        .min(1, { message: "Gemini response is missing the transaction title" }),
      amount: strictAmount,
      category: z.string().trim().min(1).optional(),
    })
    .optional(),
});

const SYSTEM_PROMPT = `You are BudgetIQ, a friendly personal-finance assistant. Keep replies short and helpful.

If the user's message is about tracking money — spending, earning, or acquiring an asset — set "hasAction" to true and fill the "transaction" object:
- "type" must be exactly "income", "expense", or "asset".
- "title" is a short label, at most 255 characters.
- "amount" is a positive number. Parse $, €, £, and plain numbers ("$45" -> 45, "15 euros" -> 15).
- "category" is a best-guess category such as Food, Transport, Salary, Rent, or General.
- "message" is a short, natural sentence inviting the user to log the transaction.

If the message is not about tracking money, set "hasAction" to false and answer the question helpfully in "message".`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    message: { type: "string" },
    hasAction: { type: "boolean" },
    transaction: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["income", "expense", "asset"] },
        title: { type: "string" },
        amount: { type: "number" },
        category: { type: "string" },
      },
      required: ["type", "title", "amount"],
    },
  },
  required: ["message", "hasAction"],
} as const;

export function parseEnvelope(raw: string): ChatActionResponse {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Gemini returned invalid JSON");
  }

  const parsed = envelopeSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Gemini returned an invalid envelope"
    );
  }

  const { message, hasAction, transaction } = parsed.data;
  if (!hasAction) {
    return { message, hasAction: false };
  }

  if (!transaction) {
    throw new Error("Gemini response is missing the transaction object");
  }

  return {
    message,
    hasAction: true,
    transaction: {
      type: transaction.type,
      title: transaction.title,
      amount: transaction.amount,
      ...(transaction.category ? { category: transaction.category } : {}),
    },
  };
}

function extractText(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Unexpected Gemini response shape");
  }
  const steps = (payload as Record<string, unknown>).steps;
  if (!Array.isArray(steps)) {
    throw new Error("Gemini response is missing steps");
  }
  for (const step of steps) {
    if (typeof step !== "object" || step === null) continue;
    const content = (step as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (typeof part !== "object" || part === null) continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string" && text.trim().length > 0) return text;
    }
  }
  throw new Error("Gemini response contains no text");
}

export async function askGemini(message: string): Promise<ChatActionResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(INTERACTIONS_ENDPOINT, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: message,
      system_instruction: SYSTEM_PROMPT,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    throw new GeminiApiError(
      response.status,
      `Gemini API error: ${response.status}`
    );
  }

  const payload = await response.json();
  return parseEnvelope(extractText(payload));
}

const ADVISOR_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    message: { type: "string" },
    adviceSummary: { type: "string" },
    extractedActuals: {
      type: "object",
      properties: {
        essentials: { type: "number" },
        lifestyle: { type: "number" },
        emergencyFund: { type: "number" },
        investments: { type: "number" },
      },
    },
  },
  required: ["message"],
} as const;

export async function askBudgetAdvisor(params: {
  userInput: string;
  monthlySalary: number;
  hasDependents: boolean;
  actuals: {
    essentials: number;
    lifestyle: number;
    emergencyFund: number;
    investments: number;
  };
  history: { role: string; text: string }[];
}): Promise<BudgetAdvisorResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const systemInstruction = `You are the BudgetIQ Financial Strategist.
Your goal is to guide the user to allocate their monthly salary according to these 4 strict golden rules:
1. الالتزامات الأساسية (Essential needs: Rent, car loans, utility bills, groceries): Maximum 60% of monthly salary.
2. الكماليات ونمط الحياة (Wants / Lifestyle: Travel, restaurants, cafes, delivery apps): Maximum 20% of monthly salary.
3. صندوق الطوارئ (Emergency Fund): Target pool equal to 3-6 months of essential expenses (or 12 months if they support a family/dependents). Once reached, stop adding funds.
4. الاستثمار (Investments / Wealth): The rest (10% to 20%+). Lowering lifestyle to raise investments accelerates financial independence.

Context for this user:
- Monthly Salary: ${params.monthlySalary}
- Supports Dependents/Family: ${params.hasDependents ? "Yes (12 months emergency target)" : "No (3-6 months emergency target)"}
- Current Actuals:
  * Essentials: ${params.actuals.essentials}
  * Lifestyle: ${params.actuals.lifestyle}
  * Emergency Fund: ${params.actuals.emergencyFund}
  * Investments: ${params.actuals.investments}

Instructions:
- When the user tells you about their expenses (e.g., "I spend 1500 on rent and 400 on dining out"), extract and update the numbers into "extractedActuals". Only include categories the user mentioned or updated.
- Compare their actual values with the benchmark KPIs.
- In "message", reply in the same language the user wrote in (natural, motivating Arabic, English, French, or any other language), highlighting whether they are over/under budget, and advise how to adjust.
- In "adviceSummary", write a concise 1-2 sentence recommendation.`;

  const conversationContext = params.history
    .slice(-6)
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`)
    .join("\n");

  const promptInput = conversationContext
    ? `${conversationContext}\nUser: ${params.userInput}`
    : params.userInput;

  const response = await fetch(INTERACTIONS_ENDPOINT, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: promptInput,
      system_instruction: systemInstruction,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: ADVISOR_RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    throw new GeminiApiError(response.status, `Gemini API error: ${response.status}`);
  }

  const payload = await response.json();
  const rawText = extractText(payload);

  try {
    return JSON.parse(rawText) as BudgetAdvisorResponse;
  } catch {
    return {
      message: rawText || "تم تحليل بياناتك بنجاح.",
    };
  }
}
