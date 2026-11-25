/**
 * Speech-to-text for the assistant's voice notes.
 *
 * Gemini's multimodal `generateContent` accepts inline audio, so transcription
 * rides the same provider the assistant already uses instead of adding a
 * second vendor and a second key. The browser records a short voice note,
 * `POST /api/transcribe` forwards it here, and the transcript becomes the
 * user's message in the normal assistant flow.
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Audio is base64-inlined in the request body, and Gemini caps that request at
 * 20 MB. 8 MB of audio (roughly a minute of Opus at 32 kbps) leaves headroom
 * while the client stops recordings at 60 s.
 */
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

/** Below this a recording is an accidental tap, not speech. */
export const MIN_AUDIO_BYTES = 256;

/**
 * `gemini-3.5-flash-lite` answers audio quickly on the free tier and was
 * verified end-to-end with WebM/Opus from Chromium's MediaRecorder. Override
 * with `GEMINI_TRANSCRIBE_MODEL` for another audio-capable model.
 */
export const DEFAULT_TRANSCRIBE_MODEL = "gemini-3.5-flash-lite";

/**
 * MIME types accepted from the browser and from Gemini. MediaRecorder reports
 * `audio/webm;codecs=opus`, so parameters are stripped before matching.
 */
const MIME_ALIASES: Record<string, string> = {
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/mp3": "audio/mpeg",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/x-flac": "audio/flac",
  "audio/x-aiff": "audio/aiff",
  "audio/x-aac": "audio/aac",
};

const SUPPORTED_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/aiff",
  "audio/aac",
]);

export type TranscriptionFailureKind =
  /** No usable key, or the model is not available to this project. */
  | "config"
  /** The browser sent something that is not a recording we can read. */
  | "unsupported"
  /** The recording exceeds the size budget. */
  | "too_large"
  /** The audio is silent or unintelligible. */
  | "empty"
  /** The provider's quota is spent, including its daily cap. */
  | "quota"
  /** 5xx, or the provider reporting itself saturated. */
  | "overloaded"
  /** The provider rejected the request for any other reason. */
  | "invalid";

export class TranscriptionError extends Error {
  readonly kind: TranscriptionFailureKind;
  readonly status: number | undefined;
  /** Human-readable cause, safe to log. Never contains an API key. */
  readonly detail: string | undefined;

  constructor(
    message: string,
    options: {
      kind: TranscriptionFailureKind;
      status?: number;
      detail?: string;
    }
  ) {
    super(message);
    this.name = "TranscriptionError";
    this.kind = options.kind;
    this.status = options.status;
    this.detail = options.detail;
  }
}

/** Canonical MIME type, or null when the format is not one we accept. */
export function normalizeAudioMimeType(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;
  const base = raw.split(";")[0]?.trim().toLowerCase() ?? "";
  const canonical = MIME_ALIASES[base] ?? base;
  return SUPPORTED_MIME_TYPES.has(canonical) ? canonical : null;
}

/**
 * Models occasionally wrap a transcript in quotes or prefix it with a label
 * ("Transcript:") despite instructions. Strip that furniture so the text is
 * ready to send as a chat message, and leave the words alone.
 */
export function normalizeTranscript(raw: string): string {
  let text = raw.trim();
  for (let i = 0; i < 2; i++) {
    const before = text;
    text = text
      .replace(/^(?:transcript(?:ion)?|audio|speech)\s*[:\-]\s*/i, "")
      .replace(/^["'`“”‘’«»]+/, "")
      .replace(/["'`“”‘’«»]+$/, "")
      .trim();
    if (text === before) break;
  }
  return text.replace(/\s+/g, " ").trim();
}

type GeminiPart = { text?: unknown; thought?: unknown };
type GeminiCandidate = { content?: { parts?: unknown } };

function extractText(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    throw new TranscriptionError("Unexpected Gemini response shape", {
      kind: "invalid",
    });
  }

  const candidates = (payload as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new TranscriptionError("Gemini response contains no candidates", {
      kind: "invalid",
    });
  }

  const candidate = candidates[0] as GeminiCandidate | null;
  const parts = candidate?.content?.parts;
  if (!Array.isArray(parts)) {
    throw new TranscriptionError("Gemini response contains no text", {
      kind: "invalid",
    });
  }

  let text = "";
  for (const part of parts as GeminiPart[]) {
    if (typeof part !== "object" || part === null) continue;
    // Thinking traces are not the transcript; only the answer parts count.
    if (part.thought === true) continue;
    if (typeof part.text === "string") text += part.text;
  }
  return text;
}

async function toTranscriptionError(
  response: Response
): Promise<TranscriptionError> {
  const raw = await response.text().catch(() => "");
  let detail = raw;
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed.error?.message) detail = parsed.error.message;
  } catch {
    // Non-JSON error body; the raw text is the best detail available.
  }

  const kind: TranscriptionFailureKind =
    response.status === 429
      ? "quota"
      : response.status === 413
        ? "too_large"
        : response.status === 401 ||
            response.status === 403 ||
            response.status === 404
          ? "config"
          : response.status >= 500
            ? "overloaded"
            : "invalid";

  return new TranscriptionError(
    `Gemini transcription error: ${response.status}`,
    {
      kind,
      status: response.status,
      detail: detail.slice(0, 500),
    }
  );
}

const TRANSCRIPTION_PROMPT = `You are a speech-to-text engine.
Transcribe the voice note exactly as spoken, word for word.
- Return only the spoken words. No quotation marks, labels, timestamps, or commentary.
- Keep the speaker's language; never translate.
- If there is no intelligible speech, return an empty string.`;

/**
 * Transcribes one short recording.
 *
 * Throws `TranscriptionError` for anything the caller can act on: a missing
 * key, an unsupported format, an oversized clip, silence, or provider failure.
 */
export async function transcribeAudio(input: {
  data: Uint8Array;
  mimeType: string;
}): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new TranscriptionError("GEMINI_API_KEY is not configured", {
      kind: "config",
    });
  }

  const mimeType = normalizeAudioMimeType(input.mimeType);
  if (!mimeType) {
    throw new TranscriptionError(
      `Unsupported audio format: ${input.mimeType || "unknown"}`,
      { kind: "unsupported" }
    );
  }
  if (input.data.byteLength < MIN_AUDIO_BYTES) {
    throw new TranscriptionError("Recording is too short to transcribe", {
      kind: "empty",
    });
  }
  if (input.data.byteLength > MAX_AUDIO_BYTES) {
    throw new TranscriptionError("Recording is too large to transcribe", {
      kind: "too_large",
    });
  }

  const model =
    process.env.GEMINI_TRANSCRIBE_MODEL?.trim() || DEFAULT_TRANSCRIBE_MODEL;

  let response: Response;
  try {
    response = await fetch(
      `${ENDPOINT}/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: TRANSCRIPTION_PROMPT },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: Buffer.from(input.data).toString("base64"),
                  },
                },
              ],
            },
          ],
          // Transcription is deterministic; sampling only invents words.
          generationConfig: { temperature: 0, maxOutputTokens: 512 },
        }),
        // A hung provider must not hold the request open.
        signal: AbortSignal.timeout(30_000),
      }
    );
  } catch (error) {
    throw new TranscriptionError("Could not reach the transcription provider", {
      kind: "overloaded",
      detail: error instanceof Error ? error.message : undefined,
    });
  }

  if (!response.ok) {
    throw await toTranscriptionError(response);
  }

  const text = normalizeTranscript(extractText(await response.json()));
  if (text.length === 0) {
    throw new TranscriptionError("No speech was detected in the recording", {
      kind: "empty",
    });
  }

  return { text, model };
}
