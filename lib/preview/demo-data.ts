import { headers } from "next/headers";
import {
  getPreviewMockSession,
  PREVIEW_USER_EMAIL,
  PREVIEW_USER_ID,
  PREVIEW_USER_NAME,
} from "@/lib/auth/preview-bypass";
import { DEFAULT_KPIS } from "@/lib/kpi-defaults";
import type { Profile } from "@/lib/profiles";
import type { CustomKPI } from "@/types/kpi";
import type { Transaction } from "@/types/transaction";

/**
 * Deterministic demo data for signed preview QA requests.
 *
 * The software factory captures before/after evidence of authenticated pages by
 * signing a request with `PREVIEW_TEST_SECRET` (see `lib/auth/preview-bypass`).
 * Those requests get a synthetic user, but a real Supabase project is not
 * reachable from CI, so the read paths return this fixture instead of querying.
 *
 * Everything here is inert unless `getPreviewMockSession()` returns a session,
 * which requires `VERCEL_ENV=preview`, a configured secret and a valid,
 * fresh HMAC — the same guard the authenticated pages already rely on.
 */

export const DEMO_USER_ID = PREVIEW_USER_ID;

/** The dashboard layout gates on onboarding, so the demo profile is complete. */
export const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  email: PREVIEW_USER_EMAIL,
  full_name: PREVIEW_USER_NAME,
  avatar_url: null,
  income_type: "salaried",
  payday: 25,
  expected_income: 5200,
};

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number, hour = 9): string {
  const date = new Date(Date.now() - days * DAY);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

type DemoSeed = {
  id: string;
  type: Transaction["type"];
  title: string;
  amount: number;
  category: string;
  scope: NonNullable<Transaction["scope"]>;
  days: number;
};

// Enough rows to fill the table, exercise grouping and both scopes, and give
// the summary cards and analytics real shape — but small enough to read.
const DEMO_SEEDS: DemoSeed[] = [
  { id: "demo-txn-01", type: "income", title: "November salary", amount: 5200, category: "Salary", scope: "personal", days: 12 },
  { id: "demo-txn-02", type: "expense", title: "Rent", amount: 1450, category: "Housing", scope: "personal", days: 11 },
  { id: "demo-txn-03", type: "expense", title: "Weekly groceries", amount: 128.4, category: "Food", scope: "personal", days: 9 },
  { id: "demo-txn-04", type: "expense", title: "Coffee with client", amount: 15, category: "Food", scope: "business", days: 8 },
  { id: "demo-txn-05", type: "income", title: "Freelance invoice #142", amount: 950, category: "Freelance", scope: "business", days: 7 },
  { id: "demo-txn-06", type: "expense", title: "Train pass", amount: 92, category: "Transport", scope: "personal", days: 6 },
  { id: "demo-txn-07", type: "expense", title: "Design software", amount: 45, category: "Software", scope: "business", days: 5 },
  { id: "demo-txn-08", type: "expense", title: "Pharmacy", amount: 23.75, category: "Health", scope: "personal", days: 4 },
  { id: "demo-txn-09", type: "expense", title: "Electricity bill", amount: 76.2, category: "Utilities", scope: "personal", days: 3 },
  { id: "demo-txn-10", type: "income", title: "Dividend payout", amount: 62.5, category: "Investments", scope: "personal", days: 3 },
  { id: "demo-txn-11", type: "expense", title: "Team lunch", amount: 84.3, category: "Food", scope: "business", days: 2 },
  { id: "demo-txn-12", type: "expense", title: "Streaming bundle", amount: 19.99, category: "Subscriptions", scope: "personal", days: 2 },
  { id: "demo-txn-13", type: "expense", title: "Book: Deep Work", amount: 18.5, category: "Learning", scope: "personal", days: 1 },
  { id: "demo-txn-14", type: "expense", title: "Airport taxi", amount: 34.9, category: "Transport", scope: "business", days: 1 },
  { id: "demo-txn-15", type: "expense", title: "Groceries top-up", amount: 41.15, category: "Food", scope: "personal", days: 0 },
];

export const DEMO_TRANSACTIONS: Transaction[] = DEMO_SEEDS.map((seed) => ({
  id: seed.id,
  user_id: DEMO_USER_ID,
  type: seed.type,
  title: seed.title,
  amount: seed.amount,
  category: seed.category,
  created_at: daysAgo(seed.days),
  scope: seed.scope,
}));

/**
 * Derived from the product's own default KPI definitions so the fixture cannot
 * drift from what a real first-run user sees — including a rename in either
 * direction between a PR's base and head.
 */
export const DEMO_KPIS: CustomKPI[] = DEFAULT_KPIS.map((kpi, index) => ({
  id: `demo-kpi-${index + 1}`,
  user_id: DEMO_USER_ID,
  title: kpi.title,
  source_type: kpi.source_type,
  category_filter: kpi.category_filter ?? null,
  scope: kpi.scope ?? "all",
  timeframe: kpi.timeframe ?? "this_month",
  operation: kpi.operation,
  operand: kpi.operand ?? 1,
  sort_order: kpi.sort_order ?? index,
  created_at: daysAgo(30),
}));

/**
 * Whether the current request is a signed preview QA request.
 *
 * Call sites are the read paths the dashboard uses; each returns the fixture
 * before opening a Supabase query that CI could never satisfy.
 */
export async function isPreviewDemoRequest(): Promise<boolean> {
  try {
    return (await getPreviewMockSession(await headers())) !== null;
  } catch {
    // No request scope (unit tests, scripts): never in demo mode.
    return false;
  }
}

export async function previewDemoTransactions(
  scope: Transaction["scope"] | null = null
): Promise<Transaction[]> {
  const rows = scope
    ? DEMO_TRANSACTIONS.filter((transaction) => transaction.scope === scope)
    : DEMO_TRANSACTIONS;
  return rows.map((row) => ({ ...row }));
}

export async function previewDemoTransactionsBetween(
  startISO: string,
  endISO: string,
  limit = 500
): Promise<Transaction[]> {
  const rows = DEMO_TRANSACTIONS.filter(
    (transaction) =>
      transaction.created_at >= startISO && transaction.created_at < endISO
  );
  return rows.slice(0, limit).map((row) => ({ ...row }));
}
