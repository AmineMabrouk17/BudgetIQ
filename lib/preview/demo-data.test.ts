import { describe, it, expect } from "vitest";
import {
  DEMO_KPIS,
  DEMO_PROFILE,
  DEMO_TRANSACTIONS,
  DEMO_USER_ID,
  previewDemoTransactions,
  previewDemoTransactionsBetween,
} from "@/lib/preview/demo-data";
import { DEFAULT_KPIS } from "@/lib/kpi-defaults";

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
});
