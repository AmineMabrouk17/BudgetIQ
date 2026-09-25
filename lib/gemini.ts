import { z } from "zod";
import { completeJson, LlmError } from "@/lib/llm";
import { isAdvisorBucket } from "@/lib/salary-planner";
import type {
  AdvisorLineItem,
  BudgetAdvisorResponse,
} from "@/types/salary-planner";

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

export { LlmError };

const TRANSACTION_TYPES = [
  "income",
  "expense",
  "asset",
] as const satisfies readonly TransactionActionType[];

const INVALID_AMOUNT = "Gemini response has an invalid transaction amount";

/** A money figure that may legitimately be 0 (a salary the user has not stated). */
const nonNegativeAmount = z
  .union([z.number(), z.string()])
  .transform((value, ctx): number => {
    const text = typeof value === "number" ? String(value) : value.trim();
    if (!/^\d+(\.\d+)?$/.test(text)) {
      ctx.addIssue({ code: "custom", message: "invalid amount" });
      return z.NEVER;
    }
    return Number(text);
  });

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

export async function askGemini(message: string): Promise<ChatActionResponse> {
  const { text } = await completeJson({
    systemInstruction: SYSTEM_PROMPT,
    prompt: message,
    schema: RESPONSE_SCHEMA,
  });
  return parseEnvelope(text);
}

// Every extraction field is required: Gemini fills required fields reliably
// and silently omits optional ones, which would drop the user's whole
// breakdown. "No figures" is expressed as 0 / false / [].
const ADVISOR_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    message: { type: "string" },
    adviceSummary: { type: "string" },
    monthlySalary: { type: "number" },
    replaceActuals: { type: "boolean" },
    lineItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          amount: { type: "number" },
          bucket: {
            type: "string",
            enum: ["essentials", "lifestyle", "emergencyFund", "investments"],
          },
        },
        required: ["label", "amount", "bucket"],
      },
    },
  },
  required: ["message", "adviceSummary", "monthlySalary", "replaceActuals", "lineItems"],
} as const;

const advisorLineItemSchema = z.object({
  label: z.string().trim().min(1),
  amount: z.union([z.number(), z.string()]).transform((value, ctx): number => {
    const text = typeof value === "number" ? String(value) : value.trim();
    if (!/^\d+(\.\d+)?$/.test(text)) {
      ctx.addIssue({ code: "custom", message: "invalid line item amount" });
      return z.NEVER;
    }
    return Number(text);
  }),
  bucket: z.string().refine(isAdvisorBucket, {
    message: "invalid line item bucket",
  }),
});

/** One malformed item must not cost the user the rest of their breakdown. */
function parseAdvisorLineItems(value: unknown): AdvisorLineItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => advisorLineItemSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
  return items.length > 0 ? items : undefined;
}

const advisorEnvelopeSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, { message: "Gemini response is missing a message" }),
  adviceSummary: z.string().trim().min(1).optional(),
  monthlySalary: nonNegativeAmount.optional(),
  replaceActuals: z.boolean().optional(),
});

/**
 * Validates the advisor envelope. Never throws: a malformed response degrades
 * to its plain-text message so a bad extraction can't corrupt stored figures.
 */
export function parseAdvisorEnvelope(raw: string): BudgetAdvisorResponse {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { message: raw.trim() || "Your data has been analyzed successfully." };
  }

  const parsed = advisorEnvelopeSchema.safeParse(data);
  if (!parsed.success) {
    const fallback =
      typeof (data as { message?: unknown })?.message === "string"
        ? ((data as { message: string }).message ?? "")
        : "";
    return {
      message: fallback.trim() || "Your data has been analyzed successfully.",
    };
  }

  const { message, adviceSummary, monthlySalary, replaceActuals } = parsed.data;
  const lineItems = parseAdvisorLineItems(
    (data as { lineItems?: unknown }).lineItems
  );

  return {
    message,
    ...(adviceSummary ? { adviceSummary } : {}),
    ...(monthlySalary !== undefined ? { monthlySalary } : {}),
    ...(replaceActuals !== undefined ? { replaceActuals } : {}),
    ...(lineItems ? { lineItems } : {}),
  };
}

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
  const systemInstruction = `You are the BudgetIQ Financial Strategist.
Your goal is to guide the user to allocate their monthly salary according to these 4 strict golden rules:
1. Essentials (Rent, car loans, utility bills, groceries, subscriptions you need to work): Maximum 60% of monthly salary.
2. Lifestyle / Wants (Travel, restaurants, cafes, delivery apps, gym memberships): Maximum 20% of monthly salary.
3. Emergency Fund: Target pool equal to 3-6 months of essential expenses (or 12 months if they support a family/dependents). Once reached, stop adding funds.
4. Investments / Wealth: The rest (10% to 20%+). Lowering lifestyle to raise investments accelerates financial independence.

Context for this user:
- Monthly Salary: ${params.monthlySalary}
- Supports Dependents/Family: ${params.hasDependents ? "Yes (12 months emergency target)" : "No (3-6 months emergency target)"}
- Current Actuals:
  * Essentials: ${params.actuals.essentials}
  * Lifestyle: ${params.actuals.lifestyle}
  * Emergency Fund: ${params.actuals.emergencyFund}
  * Investments: ${params.actuals.investments}

How to read the user's numbers:
- If the user states their income, salary, wage or net monthly pay, set "monthlySalary" to that number. Otherwise set it to 0, which means "unchanged".
- List every expense the user names as its own "lineItems" entry, one entry per distinct thing. Never merge two items into one entry and never skip an item. When the user names no amounts, set "lineItems" to an empty array.
- Set "bucket" per item: "essentials" (rent, utilities, internet, groceries, daily living costs), "lifestyle" (gym, sport memberships, eating out, entertainment, travel), "emergencyFund" (money set aside for emergencies), "investments" (savings accounts, stocks, crypto, pension contributions).
- Set "replaceActuals" to true when the user gives a complete picture of what they pay this month (e.g. "here is everything I pay"), because those figures are the new totals. Set it to false when the user only adds or corrects something ("I also spend 50 on coffee"), so the amounts are added to what is already recorded.
- Use the recorded salary when the user does not state one; never invent figures.

Replies:
- In "message", reply in the same language the user wrote in (natural, motivating Arabic, English, French, or any other language), highlighting whether they are over/under budget, and advise how to adjust.
- In "adviceSummary", write a concise 1-2 sentence recommendation.`;

  const conversationContext = params.history
    .slice(-6)
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`)
    .join("\n");

  const promptInput = conversationContext
    ? `${conversationContext}\nUser: ${params.userInput}`
    : params.userInput;

  const { text, provider } = await completeJson({
    systemInstruction,
    prompt: promptInput,
    schema: ADVISOR_RESPONSE_SCHEMA,
  });

  if (provider === "openrouter") {
    console.info(`[llm] advisor answered via fallback provider: ${provider}`);
  }

  return parseAdvisorEnvelope(text);
}
