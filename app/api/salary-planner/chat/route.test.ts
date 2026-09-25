import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const upsert = vi.fn();
const maybeSingle = vi.fn();
const askBudgetAdvisor = vi.fn();
const rateLimit = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getUser: () => getUser(),
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => maybeSingle() }),
      }),
      upsert: (...args: unknown[]) => upsert(...args),
    }),
  }),
}));

vi.mock("@/lib/gemini", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/gemini")>();
  return { ...actual, askBudgetAdvisor: (...args: unknown[]) => askBudgetAdvisor(...args) };
});

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => rateLimit(...args),
}));

import { POST } from "@/app/api/salary-planner/chat/route";
import { LlmError } from "@/lib/llm";

function request(body: unknown) {
  return new Request("http://localhost/api/salary-planner/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

const BREAKDOWN = {
  message:
    "Okay here is my salary is 1700 I pay as house rent 450 for sport membership 60 for internet subscription 110 for investment 200 and for daily expenses 450",
  plan: {
    monthly_salary: 0,
    has_dependents: false,
    actual_essentials: 0,
    actual_lifestyle: 0,
    actual_emergency_fund: 0,
    actual_investments: 0,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ id: "user-1" });
  rateLimit.mockResolvedValue({ success: true });
  maybeSingle.mockResolvedValue({ data: null });
  upsert.mockResolvedValue({ error: null });
});

describe("POST /api/salary-planner/chat", () => {
  it("turns a full breakdown into per-bucket totals and a salary", async () => {
    askBudgetAdvisor.mockResolvedValue({
      message: "Your essentials are just under the cap.",
      adviceSummary: "Build an emergency fund next.",
      monthlySalary: 1700,
      replaceActuals: true,
      lineItems: [
        { label: "House rent", amount: 450, bucket: "essentials" },
        { label: "Internet subscription", amount: 110, bucket: "essentials" },
        { label: "Daily expenses", amount: 450, bucket: "essentials" },
        { label: "Sport membership", amount: 60, bucket: "lifestyle" },
        { label: "Investment", amount: 200, bucket: "investments" },
      ],
    });

    const res = await POST(request(BREAKDOWN));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.updatedSalary).toBe(1700);
    expect(body.updatedActuals).toEqual({
      actual_essentials: 1010,
      actual_lifestyle: 60,
      actual_emergency_fund: 0,
      actual_investments: 200,
    });
  });

  it("persists the salary alongside the buckets", async () => {
    askBudgetAdvisor.mockResolvedValue({
      message: "ok",
      monthlySalary: 1700,
      replaceActuals: true,
      lineItems: [{ label: "Rent", amount: 450, bucket: "essentials" }],
    });

    await POST(request(BREAKDOWN));

    const [row] = upsert.mock.calls[0];
    expect(row.monthly_salary).toBe(1700);
    expect(row.actual_essentials).toBe(450);
    expect(row.user_id).toBe("user-1");
  });

  it("adds an incremental item on top of the stored totals", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        monthly_salary: 1700,
        has_dependents: false,
        actual_essentials: 900,
        actual_lifestyle: 300,
        actual_emergency_fund: 0,
        actual_investments: 200,
        chat_messages: [],
      },
    });
    askBudgetAdvisor.mockResolvedValue({
      message: "Added it.",
      monthlySalary: 0,
      replaceActuals: false,
      lineItems: [{ label: "Coffee", amount: 50, bucket: "lifestyle" }],
    });

    // A client that omits the actuals falls back to what is on file.
    const res = await POST(
      request({ message: "I also spend 50 on coffee", plan: { monthly_salary: 1700 } })
    );
    const body = await res.json();

    expect(body.updatedActuals).toEqual({
      actual_essentials: 900,
      actual_lifestyle: 350,
      actual_emergency_fund: 0,
      actual_investments: 200,
    });
    // 0 means "unstated", so the stored salary survives.
    expect(body.updatedSalary).toBe(1700);
  });

  it("uses the live form values the client sends over what is on file", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        monthly_salary: 1700,
        has_dependents: false,
        actual_essentials: 900,
        actual_lifestyle: 300,
        actual_emergency_fund: 0,
        actual_investments: 200,
        chat_messages: [],
      },
    });
    askBudgetAdvisor.mockResolvedValue({
      message: "Recalculated.",
      monthlySalary: 2000,
      replaceActuals: false,
      lineItems: [{ label: "Coffee", amount: 50, bucket: "lifestyle" }],
    });

    const res = await POST(
      request({
        message: "I also spend 50 on coffee",
        plan: {
          monthly_salary: 2000,
          has_dependents: true,
          actual_essentials: 1000,
          actual_lifestyle: 0,
          actual_emergency_fund: 0,
          actual_investments: 0,
        },
      })
    );
    const body = await res.json();

    expect(body.updatedActuals.actual_essentials).toBe(1000);
    expect(body.updatedActuals.actual_lifestyle).toBe(50);
  });

  it("still answers when the model returns no line items", async () => {
    askBudgetAdvisor.mockResolvedValue({ message: "Ask me anything." });

    const res = await POST(request(BREAKDOWN));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.updatedActuals.actual_essentials).toBe(0);
  });

  it("explains a daily quota instead of returning a bare 500", async () => {
    askBudgetAdvisor.mockRejectedValue(
      new LlmError("All LLM providers have reached their request limit.", {
        provider: "none",
        kind: "quota",
        detail: "20 requests per day on Free Tier",
      })
    );

    const res = await POST(request(BREAKDOWN));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toMatch(/daily request limit/i);
  });

  it("explains a transient overload", async () => {
    askBudgetAdvisor.mockRejectedValue(
      new LlmError("All LLM providers are unavailable.", {
        provider: "none",
        kind: "overloaded",
      })
    );

    const res = await POST(request(BREAKDOWN));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toMatch(/busy right now/i);
  });

  it("reports an unconfigured provider as a configuration problem", async () => {
    askBudgetAdvisor.mockRejectedValue(
      new LlmError("No LLM provider is configured.", {
        provider: "none",
        kind: "config",
      })
    );

    const res = await POST(request(BREAKDOWN));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toMatch(/not available on this server/i);
  });

  it("never lets a model figure through as a negative amount", async () => {
    askBudgetAdvisor.mockResolvedValue({
      message: "ok",
      monthlySalary: -500,
      replaceActuals: true,
      lineItems: [{ label: "Rent", amount: -900, bucket: "essentials" }],
    });

    const res = await POST(request(BREAKDOWN));
    const body = await res.json();

    expect(body.updatedSalary).toBe(0);
    expect(body.updatedActuals.actual_essentials).toBe(0);
  });

  it("rejects an oversized message before spending a request", async () => {
    const res = await POST(request({ message: "x".repeat(1001) }));

    expect(res.status).toBe(413);
    expect(askBudgetAdvisor).not.toHaveBeenCalled();
  });

  it("rejects an empty message", async () => {
    const res = await POST(request({ message: "   " }));

    expect(res.status).toBe(400);
    expect(askBudgetAdvisor).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller", async () => {
    getUser.mockResolvedValue(null);

    const res = await POST(request(BREAKDOWN));

    expect(res.status).toBe(401);
  });

  it("surfaces the app's own rate limit", async () => {
    rateLimit.mockResolvedValue({ success: false });

    const res = await POST(request(BREAKDOWN));

    expect(res.status).toBe(429);
    expect(askBudgetAdvisor).not.toHaveBeenCalled();
  });

  it("still returns the reply when persisting fails", async () => {
    upsert.mockResolvedValue({ error: { message: "check violation" } });
    askBudgetAdvisor.mockResolvedValue({
      message: "Here is your plan.",
      lineItems: [{ label: "Rent", amount: 450, bucket: "essentials" }],
    });

    const res = await POST(request(BREAKDOWN));

    expect(res.status).toBe(200);
    expect((await res.json()).message).toBe("Here is your plan.");
  });
});
