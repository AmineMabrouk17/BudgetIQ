import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { askGemini } from "@/lib/gemini";

export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 1000;

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const response = await askGemini(message);
    return NextResponse.json(response);
  } catch (error) {
    try {
      const response = await askGemini(message);
      return NextResponse.json(response);
    } catch (retryError) {
      console.error("Gemini chat failed:", error, retryError);
      return NextResponse.json({
        message: "Sorry, I couldn't process that. Please try again.",
        hasAction: false,
      });
    }
  }
}
