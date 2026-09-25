import { LlmError, type LlmProvider, type LlmRequest } from "./types";

const INTERACTIONS_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

function extractText(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    throw new LlmError("Unexpected Gemini response shape", {
      provider: "gemini",
      kind: "invalid",
    });
  }
  const steps = (payload as Record<string, unknown>).steps;
  if (!Array.isArray(steps)) {
    throw new LlmError("Gemini response is missing steps", {
      provider: "gemini",
      kind: "invalid",
    });
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

    const response = await fetch(INTERACTIONS_ENDPOINT, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: prompt,
        system_instruction: systemInstruction,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema,
        },
      }),
    });

    if (!response.ok) {
      throw await toLlmError(response);
    }

    return extractText(await response.json());
  },
};
