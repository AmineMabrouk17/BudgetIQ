import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { askGemini, GeminiApiError } from "@/lib/gemini";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const CHAT_RATE_LIMIT = 20;
const CHAT_RATE_WINDOW = 60;

const MAX_MESSAGE_LENGTH = 1000;

const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 200;

function isRetryable(e: unknown): boolean {
  if (!(e instanceof GeminiApiError)) return false;
  return e.status === 429 || e.status >= 500;
}

async function callGeminiWithRetry(
  message: string
): Promise<ReturnType<typeof askGemini>> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await askGemini(message);
    } catch (e) {
      lastError = e;
      if (!isRetryable(e) || attempt === MAX_RETRIES) throw e;
      await new Promise((resolve) =>
        setTimeout(resolve, BASE_RETRY_DELAY_MS * 2 ** attempt)
      );
    }
  }
  throw lastError;
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await rateLimit({
    prefix: "chat",
    identifier: user.id,
    limit: CHAT_RATE_LIMIT,
    window: CHAT_RATE_WINDOW,
  });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message =
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).message === "string"
      ? (body as { message: string }).message.trim()
      : "";

  if (message.length === 0) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: "Message is too long" },
      { status: 413 }
    );
  }

  try {
    const response = await callGeminiWithRetry(message);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Gemini chat failed:", error);
    return NextResponse.json({
      message: "Sorry, I couldn't process that. Please try again.",
      hasAction: false,
    });
  }
}
