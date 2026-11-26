import { describe, it, expect } from "vitest";
import {
  DEMO_KPIS,
  DEMO_PROFILE,
  DEMO_TRANSACTIONS,
  DEMO_USER_ID,
  addPreviewDemoTransaction,
  previewDemoTransactions,
  previewDemoTransactionsBetween,
  removePreviewDemoTransaction,
} from "@/lib/preview/demo-data";
import { DEFAULT_KPIS } from "@/lib/kpi-defaults";
import type { Transaction } from "@/types/transaction";

describe("preview demo fixture", () => {
  it("gives the demo user a complete profile", () => {
    expect(DEMO_PROFILE.id).toBe(DEMO_USER_ID);
    expect(DEMO_PROFILE.email).not.toBeNull();
  });

  it("provides transactions for both scopes so either filter renders rows", async () => {
    expect(DEMO_TRANSACTIONS.length).toBeGreaterThan(10);
    const personal = await previewDemoTransactions("personal");
    const business = await previewDemoTransactions("business");
    expect(personal.length).toBeGreaterThan(0);
    expect(business.length).toBeGreaterThan(0);
    expect(business.every((t) => t.scope === "business")).toBe(true);
  });

  it("returns rows newest first and filtered by an ISO window", async () => {
    const sorted = [...DEMO_TRANSACTIONS].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    const first = sorted[0].created_at;
    const last = sorted[sorted.length - 1].created_at;
    const window = await previewDemoTransactionsBetween(last, `${first}Z`);
    expect(window.length).toBeGreaterThan(0);
    expect(
      window.every((t) => t.created_at >= last && t.created_at < `${first}Z`)
    ).toBe(true);
  });

  it("keeps KPI cards identical to the product's seeded defaults", () => {
    expect(DEMO_KPIS.map((kpi) => kpi.title)).toEqual(
      DEFAULT_KPIS.map((kpi) => kpi.title)
    );
    expect(DEMO_KPIS.map((kpi) => kpi.operation)).toEqual(
      DEFAULT_KPIS.map((kpi) => kpi.operation)
    );
  });

  it("serves transactions written by a signed preview session", async () => {
    const row: Transaction = {
      id: "demo-write-1",
      user_id: DEMO_USER_ID,
      type: "expense",
      title: "Voice note coffee",
      amount: 15,
      category: "Food",
      created_at: new Date().toISOString(),
      scope: "personal",
    };

    addPreviewDemoTransaction(row);

    const rows = await previewDemoTransactions();
    expect(rows[0]).toMatchObject({ id: row.id, title: row.title });
    expect(
      await previewDemoTransactionsBetween(
        new Date(Date.now() - 60_000).toISOString(),
        new Date(Date.now() + 60_000).toISOString()
      )
    ).toEqual(expect.arrayContaining([expect.objectContaining({ id: row.id })]));

    removePreviewDemoTransaction(row.id);
    expect((await previewDemoTransactions()).some((t) => t.id === row.id)).toBe(
      false
    );
  });
});
