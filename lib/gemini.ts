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

const TRANSACTION_TYPES: readonly TransactionActionType[] = [
  "income",
  "expense",
  "asset",
];

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

  if (typeof data !== "object" || data === null) {
    throw new Error("Gemini returned a non-object envelope");
  }

  const record = data as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message.trim() : "";
  if (message.length === 0) {
    throw new Error("Gemini response is missing a message");
  }

  if (record.hasAction !== true) {
    return { message, hasAction: false };
  }

  const transaction = record.transaction;
  if (typeof transaction !== "object" || transaction === null) {
    throw new Error("Gemini response is missing the transaction object");
  }

  const t = transaction as Record<string, unknown>;
  const type = t.type;
  if (
    typeof type !== "string" ||
    !TRANSACTION_TYPES.includes(type as TransactionActionType)
  ) {
    throw new Error("Gemini response has an invalid transaction type");
  }

  const title = typeof t.title === "string" ? t.title.trim() : "";
  if (title.length === 0) {
    throw new Error("Gemini response is missing the transaction title");
  }

  const amount =
    typeof t.amount === "number" ? t.amount : Number.parseFloat(String(t.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Gemini response has an invalid transaction amount");
  }

  const category =
    typeof t.category === "string" && t.category.trim().length > 0
      ? t.category.trim()
      : undefined;

  return {
    message,
    hasAction: true,
    transaction: {
      type: type as TransactionActionType,
      title,
      amount,
      ...(category ? { category } : {}),
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
