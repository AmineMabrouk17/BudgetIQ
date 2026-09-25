import { geminiProvider } from "./gemini";
import { openRouterProvider } from "./openrouter";
import {
  LlmError,
  type LlmCompletion,
  type LlmProvider,
  type LlmRequest,
} from "./types";

/**
 * Providers in preference order. Gemini leads because it is cheaper and its
 * structured outputs are enforced; OpenRouter is the safety net for when
 * Gemini's quota is spent or it is saturated.
 */
const PROVIDERS: LlmProvider[] = [geminiProvider, openRouterProvider];

const MAX_ATTEMPTS_PER_PROVIDER = 3;
const BASE_RETRY_DELAY_MS = 750;
const MAX_RETRY_DELAY_MS = 8000;

/**
 * Retrying only helps a transient failure. A daily quota cap or a rejected
 * request will fail identically every time, so those move on immediately.
 */
function shouldRetry(error: LlmError, attempt: number): boolean {
  if (attempt >= MAX_ATTEMPTS_PER_PROVIDER) return false;
  return error.kind === "overloaded";
}

function retryDelayMs(error: LlmError, attempt: number): number {
  if (error.retryAfterMs !== undefined) {
    return Math.min(
      Math.max(error.retryAfterMs, BASE_RETRY_DELAY_MS),
      MAX_RETRY_DELAY_MS
    );
  }
  const backoff = BASE_RETRY_DELAY_MS * 2 ** attempt;
  // Jitter keeps concurrent users from retrying in lockstep.
  const jitter = backoff * 0.25 * Math.random();
  return Math.min(backoff + jitter, MAX_RETRY_DELAY_MS);
}

async function runProvider(
  provider: LlmProvider,
  request: LlmRequest
): Promise<string> {
  let lastError: LlmError | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_PROVIDER; attempt++) {
    try {
      return await provider.complete(request);
    } catch (error) {
      const llmError =
        error instanceof LlmError
          ? error
          : new LlmError(
              error instanceof Error ? error.message : "Unknown provider error",
              { provider: provider.name, kind: "invalid" }
            );

      lastError = llmError;
      if (!shouldRetry(llmError, attempt)) throw llmError;
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelayMs(llmError, attempt))
      );
    }
  }

  throw (
    lastError ??
    new LlmError(`${provider.name} failed without an error`, {
      provider: provider.name,
      kind: "invalid",
    })
  );
}

/**
 * Completes a request against the first provider that can answer, falling back
 * to the next whenever the current one is exhausted, saturated, or unconfigured.
 */
export async function completeJson(
  request: LlmRequest
): Promise<LlmCompletion> {
  const failures: LlmError[] = [];

  for (const provider of PROVIDERS) {
    if (!provider.isConfigured()) {
      console.info(`[llm] skipping ${provider.name}: no API key configured`);
      continue;
    }

    try {
      const text = await runProvider(provider, request);
      if (failures.length > 0) {
        console.warn(
          `[llm] ${provider.name} answered after ${failures.length} earlier failure(s)`,
          failures.map((f) => `${f.provider}:${f.kind}`)
        );
      }
      return { text, provider: provider.name };
    } catch (error) {
      const llmError =
        error instanceof LlmError
          ? error
          : new LlmError("Unknown provider error", {
              provider: provider.name,
              kind: "invalid",
            });
      failures.push(llmError);
      console.error(
        `[llm] ${provider.name} failed (${llmError.kind}${
          llmError.status ? ` ${llmError.status}` : ""
        })${llmError.detail ? `: ${llmError.detail}` : ""}`
      );
    }
  }

  if (failures.length === 0) {
    throw new LlmError(
      "No LLM provider is configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY.",
      { provider: "none", kind: "config" }
    );
  }

  // Every provider has the same underlying complaint only when they are all
  // out of quota; surface that, since retrying soon will not help.
  const allQuota = failures.every((f) => f.kind === "quota");
  throw new LlmError(
    allQuota
      ? "All LLM providers have reached their request limit."
      : "All LLM providers are unavailable.",
    {
      provider: "none",
      kind: allQuota ? "quota" : "overloaded",
      detail: failures
        .map((f) => `${f.provider}: ${f.detail ?? f.message}`)
        .join(" | "),
    }
  );
}

export { LlmError } from "./types";
export type { LlmCompletion, LlmProviderName, LlmRequest } from "./types";
