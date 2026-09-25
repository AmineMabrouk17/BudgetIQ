/**
 * Provider-agnostic contract for a text/JSON completion.
 *
 * Callers describe *what* they want (a system instruction, a prompt, and
 * optionally a JSON Schema) and never learn which provider answered.
 */

export type LlmProviderName = "gemini" | "openrouter";

/**
 * Why a provider could not answer. The router uses this to decide whether a
 * failure is worth retrying (transient) or whether to move straight on to the
 * next provider (permanent for this request).
 */
export type LlmFailureKind =
  /** A quota or rate limit. Includes daily caps that a retry cannot clear. */
  | "quota"
  /** 5xx, or a provider reporting itself saturated. */
  | "overloaded"
  /** The request itself was rejected: 4xx, bad schema, unparseable answer. */
  | "invalid"
  /** The provider is not usable at all: no API key, unknown model. */
  | "config";

export class LlmError extends Error {
  readonly provider: LlmProviderName | "none";
  readonly kind: LlmFailureKind;
  readonly status: number | undefined;
  readonly retryAfterMs: number | undefined;
  /** Human-readable cause, safe to log. Never contains an API key. */
  readonly detail: string | undefined;

  constructor(
    message: string,
    options: {
      provider: LlmProviderName | "none";
      kind: LlmFailureKind;
      status?: number;
      retryAfterMs?: number;
      detail?: string;
    }
  ) {
    super(message);
    this.name = "LlmError";
    this.provider = options.provider;
    this.kind = options.kind;
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
    this.detail = options.detail;
  }
}

/** A JSON Schema subset, enough to describe the envelopes this app expects. */
export type JsonSchema = Record<string, unknown>;

export type LlmRequest = {
  systemInstruction: string;
  prompt: string;
  /**
   * Requested output shape. Providers that support structured outputs enforce
   * it; the rest are told the schema in their instructions and parsed leniently.
   */
  schema?: JsonSchema;
};

export type LlmCompletion = {
  text: string;
  provider: LlmProviderName;
};

export type LlmProvider = {
  name: LlmProviderName;
  /** False when the provider has no API key configured and must be skipped. */
  isConfigured(): boolean;
  complete(request: LlmRequest): Promise<string>;
};
