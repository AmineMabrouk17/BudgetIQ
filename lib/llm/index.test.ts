import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LlmError, type LlmProvider, type LlmRequest } from "@/lib/llm/types";

const request: LlmRequest = {
  systemInstruction: "You are a test.",
  prompt: "hello",
  schema: { type: "object", properties: { message: { type: "string" } } },
};

// The provider list is module-level, so each test builds its own fake pair and
// re-imports the router with the real providers replaced.
const gemini = { name: "gemini" } as const;
const openrouter = { name: "openrouter" } as const;

let providers: LlmProvider[] = [];

vi.mock("@/lib/llm/gemini", () => ({
  geminiProvider: {
    get name() {
      return gemini.name;
    },
    isConfigured: () => providers[0].isConfigured(),
    complete: (r: LlmRequest) => providers[0].complete(r),
  },
}));

vi.mock("@/lib/llm/openrouter", () => ({
  openRouterProvider: {
    get name() {
      return openrouter.name;
    },
    isConfigured: () => providers[1].isConfigured(),
    complete: (r: LlmRequest) => providers[1].complete(r),
  },
}));

function fakeProvider(
  overrides: Partial<LlmProvider> & Pick<LlmProvider, "name">
): LlmProvider {
  return {
    isConfigured: () => true,
    complete: async () => "{}",
    ...overrides,
  };
}

const { completeJson } = await import("@/lib/llm");

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("completeJson provider order", () => {
  it("uses gemini when it is configured and answers", async () => {
    const geminiComplete = vi.fn().mockResolvedValue('{"message":"hi"}');
    const openRouterComplete = vi.fn().mockResolvedValue('{"message":"no"}');
    providers = [
      fakeProvider({ name: "gemini", complete: geminiComplete }),
      fakeProvider({ name: "openrouter", complete: openRouterComplete }),
    ];

    const result = await completeJson(request);

    expect(result).toEqual({ text: '{"message":"hi"}', provider: "gemini" });
    expect(openRouterComplete).not.toHaveBeenCalled();
  });

  it("falls back to openrouter when gemini has spent its quota", async () => {
    providers = [
      fakeProvider({
        name: "gemini",
        complete: vi
          .fn()
          .mockRejectedValue(
            new LlmError("429", { provider: "gemini", kind: "quota", status: 429 })
          ),
      }),
      fakeProvider({
        name: "openrouter",
        complete: vi.fn().mockResolvedValue('{"message":"from fallback"}'),
      }),
    ];

    const result = await completeJson(request);

    expect(result).toEqual({
      text: '{"message":"from fallback"}',
      provider: "openrouter",
    });
  });

  it("falls back when gemini is saturated after exhausting its retries", async () => {
    const geminiComplete = vi
      .fn()
      .mockRejectedValue(
        new LlmError("503", { provider: "gemini", kind: "overloaded" })
      );
    providers = [
      fakeProvider({ name: "gemini", complete: geminiComplete }),
      fakeProvider({
        name: "openrouter",
        complete: vi.fn().mockResolvedValue("{}"),
      }),
    ];

    const result = await completeJson(request);

    expect(result.provider).toBe("openrouter");
    // 1 initial attempt + 2 retries, then it gives up and moves on.
    expect(geminiComplete).toHaveBeenCalledTimes(3);
  }, 20000);

  it("skips gemini entirely when it has no api key", async () => {
    const geminiComplete = vi.fn();
    providers = [
      fakeProvider({
        name: "gemini",
        isConfigured: () => false,
        complete: geminiComplete,
      }),
      fakeProvider({
        name: "openrouter",
        complete: vi.fn().mockResolvedValue("{}"),
      }),
    ];

    const result = await completeJson(request);

    expect(geminiComplete).not.toHaveBeenCalled();
    expect(result.provider).toBe("openrouter");
  });

  it("skips openrouter when it has no api key", async () => {
    providers = [
      fakeProvider({
        name: "gemini",
        complete: vi.fn().mockRejectedValue(
          new LlmError("429", { provider: "gemini", kind: "quota" })
        ),
      }),
      fakeProvider({ name: "openrouter", isConfigured: () => false }),
    ];

    await expect(completeJson(request)).rejects.toMatchObject({
      provider: "none",
    });
  });

  it("does not retry a quota failure before falling back", async () => {
    const geminiComplete = vi
      .fn()
      .mockRejectedValue(
        new LlmError("429 daily cap", { provider: "gemini", kind: "quota" })
      );
    providers = [
      fakeProvider({ name: "gemini", complete: geminiComplete }),
      fakeProvider({ name: "openrouter", complete: vi.fn().mockResolvedValue("{}") }),
    ];

    await completeJson(request);

    expect(geminiComplete).toHaveBeenCalledTimes(1);
  }, 20000);

  it("does not retry a rejected request before falling back", async () => {
    const geminiComplete = vi
      .fn()
      .mockRejectedValue(
        new LlmError("400 bad schema", { provider: "gemini", kind: "invalid" })
      );
    providers = [
      fakeProvider({ name: "gemini", complete: geminiComplete }),
      fakeProvider({ name: "openrouter", complete: vi.fn().mockResolvedValue("{}") }),
    ];

    await completeJson(request);

    expect(geminiComplete).toHaveBeenCalledTimes(1);
  });
});

describe("completeJson total failure", () => {
  it("reports quota when every provider is out of quota", async () => {
    providers = [
      fakeProvider({
        name: "gemini",
        complete: vi
          .fn()
          .mockRejectedValue(
            new LlmError("gemini 429", {
              provider: "gemini",
              kind: "quota",
              detail: "20 requests per day",
            })
          ),
      }),
      fakeProvider({
        name: "openrouter",
        complete: vi
          .fn()
          .mockRejectedValue(
            new LlmError("openrouter 429", {
              provider: "openrouter",
              kind: "quota",
              detail: "50 requests per day",
            })
          ),
      }),
    ];

    await expect(completeJson(request)).rejects.toMatchObject({
      kind: "quota",
      provider: "none",
    });
  });

  it("reports unavailable when providers fail for mixed reasons", async () => {
    providers = [
      fakeProvider({
        name: "gemini",
        complete: vi
          .fn()
          .mockRejectedValue(
            new LlmError("gemini 429", { provider: "gemini", kind: "quota" })
          ),
      }),
      fakeProvider({
        name: "openrouter",
        complete: vi
          .fn()
          .mockRejectedValue(
            new LlmError("openrouter 401", { provider: "openrouter", kind: "config" })
          ),
      }),
    ];

    await expect(completeJson(request)).rejects.toMatchObject({
      kind: "overloaded",
    });
  });

  it("keeps each provider's reason for diagnosis", async () => {
    providers = [
      fakeProvider({
        name: "gemini",
        complete: vi
          .fn()
          .mockRejectedValue(
            new LlmError("gemini", { provider: "gemini", kind: "quota", detail: "gemini detail" })
          ),
      }),
      fakeProvider({
        name: "openrouter",
        complete: vi
          .fn()
          .mockRejectedValue(
            new LlmError("or", { provider: "openrouter", kind: "quota", detail: "openrouter detail" })
          ),
      }),
    ];

    await expect(completeJson(request)).rejects.toMatchObject({
      detail: expect.stringContaining("gemini detail"),
    });
  });

  it("explains when no provider is configured at all", async () => {
    providers = [
      fakeProvider({ name: "gemini", isConfigured: () => false }),
      fakeProvider({ name: "openrouter", isConfigured: () => false }),
    ];

    await expect(completeJson(request)).rejects.toMatchObject({
      kind: "config",
    });
  });

  it("never leaks an api key into the error", async () => {
    providers = [
      fakeProvider({
        name: "gemini",
        complete: vi
          .fn()
          .mockRejectedValue(new Error("boom sk-or-v1-secret")),
      }),
      fakeProvider({
        name: "openrouter",
        complete: vi.fn().mockRejectedValue(new Error("boom too")),
      }),
    ];

    await expect(completeJson(request)).rejects.toSatisfy(
      (error: Error) => !error.message.includes("sk-or-v1-secret")
    );
  });
});
