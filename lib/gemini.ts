import { z } from "zod";

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
