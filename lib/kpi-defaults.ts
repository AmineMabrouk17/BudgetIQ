import type { CreateCustomKPIInput } from "@/types/kpi";

/**
 * The KPIs a new account starts with.
 *
 * Shared by seeding (`lib/kpi.ts`) and the preview demo fixture
 * (`lib/preview/demo-data.ts`) so evidence cannot drift from the product.
 */
export const DEFAULT_KPIS: CreateCustomKPIInput[] = [
  {
    title: "Income",
    source_type: "income",
    operation: "sum",
    sort_order: 0,
  },
  {
    title: "Tax Reserve 15%",
    source_type: "expense",
    operation: "percentage",
    operand: 0.15,
    sort_order: 1,
  },
  {
    title: "Amount Under Target",
    source_type: "expense",
    operation: "budget_remaining",
    operand: 600,
    sort_order: 2,
  },
];
