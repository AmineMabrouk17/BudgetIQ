import { OpenRouter } from "@openrouter/sdk";
import type { ChatResult } from "@openrouter/sdk/models/chatresult";
import { LlmError, type LlmProvider, type LlmRequest } from "./types";

/**
 * OpenRouter exposes many models but structured outputs are not universally
 * supported — `nvidia/nemotron-3-ultra-550b-a55b:free` is not one of them. So
 * the schema is stated in the prompt and the reply is parsed leniently.
 */
const DEFAULT_MODEL =
  "nvidia/nemotron-3-ultra-550b-a55b:free";

function modelId(): string {
  return process.env.OPENROUTER_FALLBACK_MODEL ?? DEFAULT_MODEL;
}

let client: OpenRouter | null = null;

function getClient(): OpenRouter {
  if (!client) {
    client = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY ?? "",
      ...(process.env.NEXT_PUBLIC_SITE_URL
        ? { httpReferer: process.env.NEXT_PUBLIC_SITE_URL }
        : {}),
      appTitle: "BudgetIQ",
    });
  }
  return client;
}

export function renderSchemaInstruction(request: LlmRequest): string {
  const base = [
    request.systemInstruction,
    "",
    "Formatting requirements (mandatory):",
    "- Reply with a single JSON object and nothing else: no prose, no explanation, no markdown code fences.",
    "- Every key listed below must be present. Use 0, false or [] when the user gave you no figure for that key.",
  ];

  if (!request.schema) return base.join("\n");

  base.push(
    "- The object must match this JSON Schema exactly:",
    JSON.stringify(request.schema, null, 2)
  );
  return base.join("\n");
}

/**
 * Finds the first balanced JSON value in a string, skipping braces and
 * brackets that appear inside string literals. Returns -1 when unbalanced.
 */
function findBalancedEnd(text: string, start: number): number {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{" || char === "[") stack.push(char === "{" ? "}" : "]");
    else if (char === "}" || char === "]") {
      if (stack.pop() !== char) return -1;
      if (stack.length === 0) return i;
    }
  }

  return -1;
}

/**
 * Recovers the JSON value from a reply that may be wrapped in code fences or a
 * sentence of preamble. Returns the raw text when there is no JSON at all,
 * so the caller's own parser can still fall back to treating it as prose.
 */
export function extractJsonObject(text: string): string {
  const trimmed = text.trim();

  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = (fenced ? fenced[1].trim() : trimmed).trim();

  if (candidate.startsWith("{") || candidate.startsWith("[")) {
    return candidate;
  }

  const openers = [trimmed.indexOf("{"), trimmed.indexOf("[")].filter(
    (i) => i !== -1
  );
  if (openers.length === 0) return trimmed;

  const start = Math.min(...openers);
  const end = findBalancedEnd(trimmed, start);
  return end === -1 ? trimmed : trimmed.slice(start, end + 1);
}

function classify(status: number): LlmError["kind"] {
  if (status === 429) return "quota";
  if (status === 402) return "quota";
  if (status >= 500) return "overloaded";
  if (status === 401 || status === 403) return "config";
  return "invalid";
}

function toLlmError(error: unknown): LlmError {
  const maybeHttp = error as {
    statusCode?: number;
    status?: number;
    body?: string;
    headers?: Headers;
    message?: string;
  };

  const status = maybeHttp?.statusCode ?? maybeHttp?.status;
  if (typeof status !== "number") {
    return new LlmError(
      `OpenRouter request failed: ${maybeHttp?.message ?? "unknown error"}`,
      { provider: "openrouter", kind: "overloaded", detail: maybeHttp?.message }
    );
  }

  const retryAfterHeader = maybeHttp?.headers?.get?.("retry-after");
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;

  return new LlmError(`OpenRouter API error: ${status}`, {
    provider: "openrouter",
    kind: classify(status),
    status,
    ...(Number.isFinite(retryAfterSeconds)
      ? { retryAfterMs: retryAfterSeconds * 1000 }
      : {}),
    detail: (maybeHttp?.body ?? maybeHttp?.message ?? "").slice(0, 500),
  });
}

export const openRouterProvider: LlmProvider = {
  name: "openrouter",

  isConfigured() {
    return Boolean(process.env.OPENROUTER_API_KEY);
  },

  async complete(request: LlmRequest) {
    const response = await getClient()
      .chat.send({
        chatRequest: {
          model: modelId(),
          messages: [
            { role: "system", content: renderSchemaInstruction(request) },
            { role: "user", content: request.prompt },
          ],
          stream: false,
        },
      })
      .catch((error: unknown) => {
        throw toLlmError(error);
      });

    // The SDK's `stream: false` overload does not resolve (its parameter type
    // is an unsatisfiable intersection), so the union survives to here. Guard
    // at runtime rather than casting, so a silent stream is caught.
    if (!isChatResult(response)) {
      throw new LlmError("OpenRouter returned a stream instead of a completion", {
        provider: "openrouter",
        kind: "invalid",
      });
    }

    const content = response.choices[0]?.message?.content;

    if (typeof content !== "string" || content.trim().length === 0) {
      // An empty completion is a capacity problem, not a bad request: the
      // reasoning models here can burn their budget without emitting text.
      throw new LlmError("OpenRouter returned an empty completion", {
        provider: "openrouter",
        kind: "overloaded",
      });
    }

    if (process.env.NODE_ENV !== "production") {
      const reasoningTokens =
        response.usage?.completionTokensDetails?.reasoningTokens;
      console.info(
        `[llm] openrouter ${modelId()} tokens=${response.usage?.totalTokens}${
          reasoningTokens ? ` reasoning=${reasoningTokens}` : ""
        }`
      );
    }

    return extractJsonObject(content);
  },
};

function isChatResult(
  value: unknown
): value is ChatResult {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as ChatResult).choices)
  );
}
