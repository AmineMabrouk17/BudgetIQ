import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  MAX_AUDIO_BYTES,
  TranscriptionError,
  normalizeAudioMimeType,
  transcribeAudio,
} from "@/lib/transcribe";

export const runtime = "nodejs";

const TRANSCRIBE_RATE_LIMIT = 10;
const TRANSCRIBE_RATE_WINDOW = 60;

function statusFor(error: TranscriptionError): number {
  switch (error.kind) {
    case "unsupported":
      return 415;
    case "too_large":
      return 413;
    case "empty":
      return 422;
    case "quota":
      return 429;
    case "overloaded":
      return 503;
    case "config":
      return 500;
    default:
      return 502;
  }
}

function messageFor(error: TranscriptionError): string {
  switch (error.kind) {
    case "unsupported":
      return "That audio format is not supported.";
    case "too_large":
      return "That recording is too long. Keep voice notes under a minute.";
    case "empty":
      return "I couldn't hear any speech in that recording. Please try again.";
    case "quota":
      return "Voice transcription has reached its limit. Please try again later.";
    case "config":
      return "Voice transcription is not configured on this server.";
    case "overloaded":
      return "Voice transcription is busy right now. Please try again.";
    default:
      return "I couldn't transcribe that recording. Please try again.";
  }
}

/**
 * `instanceof File` is unreliable across realms (a route can be handed a File
 * from a different runtime than the global constructor), so accept any blob
 * that can report a size and produce bytes.
 */
function isAudioBlob(value: unknown): value is Blob {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Blob).size === "number" &&
    typeof (value as Blob).arrayBuffer === "function" &&
    typeof (value as Blob).type === "string"
  );
}

function timingHeaders(startedAt: number) {
  const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
  return {
    "Server-Timing": `transcribe;dur=${durationMs}`,
    "X-Transcribe-Ms": String(durationMs),
  };
}

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await rateLimit({
    prefix: "transcribe",
    identifier: user.id,
    limit: TRANSCRIBE_RATE_LIMIT,
    window: TRANSCRIBE_RATE_WINDOW,
  });
  if (!rate.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json(
      { error: "Send the recording as multipart/form-data." },
      { status: 415 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 }
    );
  }

  const audio = form.get("audio");
  if (!isAudioBlob(audio)) {
    return NextResponse.json(
      { error: "An audio file is required." },
      { status: 400 }
    );
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "That recording is too long. Keep voice notes under a minute." },
      { status: 413 }
    );
  }
  if (audio.size === 0) {
    return NextResponse.json(
      { error: "No audio was captured. Try recording again." },
      { status: 422 }
    );
  }

  // A browser sends parameters such as `;codecs=opus`; the filename extension
  // is only a fallback for the rare client that leaves the type blank.
  const mimeType = normalizeAudioMimeType(
    audio.type || form.get("audioType")?.toString()
  );
  if (!mimeType) {
    return NextResponse.json(
      { error: "That audio format is not supported." },
      { status: 415 }
    );
  }

  try {
    const data = new Uint8Array(await audio.arrayBuffer());
    const { text } = await transcribeAudio({ data, mimeType });
    return NextResponse.json(
      { transcript: text },
      { headers: timingHeaders(startedAt) }
    );
  } catch (error) {
    if (error instanceof TranscriptionError) {
      console.error(
        `[transcribe] ${error.kind}${error.status ? ` ${error.status}` : ""}${
          error.detail ? `: ${error.detail}` : ""
        }`
      );
      return NextResponse.json(
        { error: messageFor(error) },
        { status: statusFor(error), headers: timingHeaders(startedAt) }
      );
    }
    console.error("Voice transcription failed:", error);
    return NextResponse.json(
      { error: "I couldn't transcribe that recording. Please try again." },
      { status: 502 }
    );
  }
}
