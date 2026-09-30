import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getTransactions,
  getTransactionsPage,
} from "@/lib/transactions";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
}));

import { createClient, getUser } from "@/lib/supabase/server";

type MockChain = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

function makeQuery(rows: unknown[]): { chain: MockChain; calls: string[] } {
  const calls: string[] = [];
  const chain: MockChain = {
    select: vi.fn(function (this: MockChain) {
      return this;
    }),
    eq: vi.fn(function (this: MockChain, col: string, val: unknown) {
      calls.push(`eq:${col}=${String(val)}`);
      return this;
    }),
    order: vi.fn(function (this: MockChain) {
      return this;
    }),
    limit: vi.fn(function (this: MockChain) {
      return this;
    }),
    or: vi.fn(function (this: MockChain) {
      return this;
    }),
    then: vi.fn(async (resolve: (v: unknown) => void) => {
      resolve({ data: rows, error: null });
    }),
  };
  return { chain, calls };
}

function mockClient(chain: MockChain) {
  const user = { id: "user-1" };
  vi.mocked(getUser).mockResolvedValue(user as never);
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from: vi.fn().mockReturnValue(chain),
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getTransactionsPage", () => {
  it("applies the scope filter when a scope is provided", async () => {
    const { chain, calls } = makeQuery([{ id: "1", scope: "business" }]);
    mockClient(chain);

    const page = await getTransactionsPage(undefined, "business");

    expect(calls).toContain("eq:scope=business");
    expect(page.transactions[0].id).toBe("1");
  });

  it("does not apply a scope filter when none is given", async () => {
    const { chain, calls } = makeQuery([{ id: "2", scope: "personal" }]);
    mockClient(chain);

    await getTransactionsPage();

    expect(calls.some((c) => c.startsWith("eq:"))).toBe(false);
  });

  it("maps rows to transactions with their scope", async () => {
    const { chain } = makeQuery([
      {
        id: "3",
        user_id: "user-1",
        type: "income",
        title: "Consulting",
        amount: "1000",
        category: "General",
        created_at: "2026-01-01T00:00:00.000Z",
        scope: "business",
      },
    ]);
    mockClient(chain);

    const page = await getTransactionsPage(undefined, "business");

    expect(page.transactions[0]).toMatchObject({
      id: "3",
      amount: 1000,
      scope: "business",
    });
  });
});

describe("session lookups", () => {
  it("reads the user through the memoised helper, never the Auth API", async () => {
    const { chain } = makeQuery([]);
    const authGetUser = vi.fn();
    vi.mocked(getUser).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: authGetUser },
      from: vi.fn().mockReturnValue(chain),
    } as never);

    await getTransactions();
    await getTransactionsPage();

    // Every loader used to call `supabase.auth.getUser()` itself, which is a
    // network round-trip per loader. They now share one request-scoped memo,
    // so the Auth API is not consulted here at all.
    expect(authGetUser).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated reads without querying", async () => {
    const { chain } = makeQuery([]);
    const from = vi.fn().mockReturnValue(chain);
    vi.mocked(getUser).mockResolvedValue(null as never);
    vi.mocked(createClient).mockResolvedValue({ from } as never);

    await expect(getTransactions()).rejects.toThrow("Unauthorized");
    expect(from).not.toHaveBeenCalled();
  });
});
