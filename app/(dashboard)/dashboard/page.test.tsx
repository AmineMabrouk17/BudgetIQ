import {
  Suspense,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { describe, expect, it, vi } from "vitest";

// The page's section components reach the Supabase data layer through their
// imports. Nothing here calls them — the assertions are about the shell — so
// the env module is stubbed rather than pulling real credentials into tests.
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
  },
}));

const { default: DashboardPage } = await import(
  "@/app/(dashboard)/dashboard/page"
);
const {
  AnalyticsSkeleton,
  SummaryCardsSkeleton,
  TransactionTableSkeleton,
} = await import("@/components/dashboard/DashboardSkeletons");

type NodeProps = { children?: ReactNode; fallback?: ReactNode };

/** The fallback component behind every `<Suspense>` boundary in the tree. */
function suspenseFallbacks(node: ReactNode): unknown[] {
  const found: unknown[] = [];

  function walk(current: ReactNode) {
    if (Array.isArray(current)) {
      current.forEach(walk);
      return;
    }
    if (!isValidElement(current)) return;

    const element = current as ReactElement<NodeProps>;
    if (element.type === Suspense) found.push(element.props.fallback);
    walk(element.props.children);
  }

  walk(node);
  return found;
}

function elementTypes(node: ReactNode): Set<unknown> {
  const seen = new Set<unknown>();
  collect(node, seen);
  return seen;
}

function collect(node: ReactNode, seen: Set<unknown>) {
  if (Array.isArray(node)) {
    node.forEach((child) => collect(child, seen));
    return;
  }
  if (!isValidElement(node)) return;
  seen.add(node.type);
  collect((node as ReactElement<NodeProps>).props.children, seen);
}

describe("dashboard page shell", () => {
  it("returns its shell without awaiting any data", async () => {
    // If the page itself reached into the data layer this promise would not
    // settle until those queries did — putting them back on the critical path
    // to first byte, which is exactly what the streaming layout exists to avoid.
    const tree = await DashboardPage({ searchParams: Promise.resolve({}) });

    expect(isValidElement(tree)).toBe(true);
  });

  it("streams the summary, analytics and table behind matching skeletons", async () => {
    const tree = await DashboardPage({ searchParams: Promise.resolve({}) });
    const fallbacks = suspenseFallbacks(tree).map(
      (fallback) => (fallback as ReactElement).type
    );

    expect(fallbacks).toEqual([
      SummaryCardsSkeleton,
      AnalyticsSkeleton,
      TransactionTableSkeleton,
    ]);
  });

  it("keeps the heading in the shell so it paints before any query resolves", async () => {
    const tree = await DashboardPage({ searchParams: Promise.resolve({}) });

    expect(elementTypes(tree).has("h1")).toBe(true);
  });

  it("normalises an unrecognised scope query and still streams every section", async () => {
    const tree = await DashboardPage({
      searchParams: Promise.resolve({ scope: "nonsense" }),
    });

    expect(suspenseFallbacks(tree)).toHaveLength(3);
  });
});