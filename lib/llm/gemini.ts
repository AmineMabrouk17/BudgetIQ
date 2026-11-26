import { LlmError, type LlmProvider, type LlmRequest } from "./types";

/**
 * `generateContent` is the stable, schema-enforcing endpoint. The previous
 * `interactions` endpoint with `gemini-3.6-flash` stalled for tens of seconds
 * without a byte (and the model was congested), which is the latency this
 * provider is now built to avoid.
 */
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * `gemini-3.5-flash-lite` answered a transaction turn in under a second when
 * measured, while the larger flash model timed out. Override with
 * `GEMINI_MODEL` when a different model is preferred.
 */
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

/** A single turn must not hold the request open for half a minute. */
const REQUEST_TIMEOUT_MS = 15_000;

/** Enough for the envelope; a longer reply is wasted latency. */
const MAX_OUTPUT_TOKENS = 512;

function extractText(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    throw new LlmError("Unexpected Gemini response shape", {
      provider: "gemini",
      kind: "invalid",
    });
  }

  const candidates = (payload as Record<string, unknown>).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new LlmError("Gemini response is missing candidates", {
      provider: "gemini",
      kind: "invalid",
    });
  }

  const content = (candidates[0] as { content?: unknown } | null)?.content;
  const parts =
    typeof content === "object" && content !== null
      ? (content as { parts?: unknown }).parts
      : undefined;
  if (!Array.isArray(parts)) {
    throw new LlmError("Gemini response contains no text", {
      provider: "gemini",
      kind: "invalid",
    });
  }

  for (const part of parts) {
    if (typeof part !== "object" || part === null) continue;
    const record = part as Record<string, unknown>;
    if (record.thought === true) continue;
    const text = record.text;
    if (typeof text === "string" && text.trim().length > 0) return text;
  }

  throw new LlmError("Gemini response contains no text", {
    provider: "gemini",
    kind: "invalid",
  });
}

/**
 * A free-tier daily cap ("20 requests per day") never clears on a short retry,
 * so burning the retry budget on it just delays the error the user sees.
 */
function isDailyCap(status: number, detail: string): boolean {
  return status === 429 && /\bper day\b|\bdaily\b/i.test(detail);
}

async function toLlmError(response: Response): Promise<LlmError> {
  const raw = await response.text().catch(() => "");
  const retryAfterHeader = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
  const retryAfterMs = Number.isFinite(retryAfterSeconds)
    ? retryAfterSeconds * 1000
    : undefined;

  let detail = raw;
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed.error?.message) detail = parsed.error.message;
  } catch {
    // Non-JSON error body; the raw text is the best detail available.
  }

  const kind =
    response.status === 429
      ? "quota"
      : response.status >= 500
        ? "overloaded"
        : response.status === 404
          ? "config"
          : "invalid";

  return new LlmError(`Gemini API error: ${response.status}`, {
    provider: "gemini",
    // A daily cap is permanent for the day, not a momentary rate limit.
    kind: isDailyCap(response.status, detail) ? "quota" : kind,
    status: response.status,
    ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
    detail: detail.slice(0, 500),
  });
}

export const geminiProvider: LlmProvider = {
  name: "gemini",

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  },

  async complete({ systemInstruction, prompt, schema }: LlmRequest) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new LlmError("GEMINI_API_KEY is not configured", {
        provider: "gemini",
        kind: "config",
      });
    }

    let response: Response;
    try {
      response = await fetch(
        `${ENDPOINT}/${encodeURIComponent(MODEL)}:generateContent`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              responseMimeType: "application/json",
              ...(schema ? { responseSchema: schema } : {}),
            },
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        }
      );
    } catch (error) {
      const timedOut =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      throw new LlmError(
        timedOut ? "Gemini request timed out" : "Could not reach Gemini",
        {
          provider: "gemini",
          kind: "overloaded",
          detail: error instanceof Error ? error.message : undefined,
        }
      );
    }

    if (!response.ok) {
      throw await toLlmError(response);
    }

    return extractText(await response.json());
  },
};
