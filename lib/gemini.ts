import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-1.5-flash";

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

const TRANSACTION_TYPES: readonly TransactionActionType[] = [
  "income",
  "expense",
  "asset",
];

const SYSTEM_PROMPT = `You are BudgetIQ, a friendly personal-finance assistant. Keep replies short and helpful.

If the user's message is about tracking money — spending, earning, or acquiring an asset — respond with ONLY this JSON envelope:
{
  "message": "A short, natural sentence inviting the user to log it.",
  "hasAction": true,
  "transaction": {
    "type": "income", "expense", or "asset",
    "title": "Short title, at most 255 characters",
    "amount": <positive number>,
    "category": "Best-guess category such as Food, Transport, Salary, Rent, or General"
  }
}

Rules:
- "type" must be exactly "income", "expense", or "asset".
- "amount" must be a positive number. Parse $, €, £, and plain numbers ("$45" -> 45, "15 euros" -> 15).
- Omit "category" when unsure.
- If the message is not about tracking money, respond with ONLY:
{ "message": "<a helpful, short answer>", "hasAction": false }
- Always respond with valid JSON. No markdown, no code fences, no extra text.`;

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

export async function askGemini(message: string): Promise<ChatActionResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const result = await model.generateContent(message);
  return parseEnvelope(result.response.text());
}
