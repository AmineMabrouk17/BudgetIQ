import { createClient } from "@/lib/supabase/server";
import type { CreateCustomKPIInput } from "@/types/kpi";

const DEFAULT_KPIS: CreateCustomKPIInput[] = [
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
    title: "Budget Remaining",
    source_type: "expense",
    operation: "budget_remaining",
    operand: 600,
    sort_order: 2,
  },
];

export async function seedDefaultKpis(userId: string): Promise<void> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("custom_kpis")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count && count > 0) return;

  const rows = DEFAULT_KPIS.map((kpi) => ({
    user_id: userId,
    title: kpi.title,
    source_type: kpi.source_type,
    category_filter: kpi.category_filter ?? null,
    scope: kpi.scope ?? "all",
    timeframe: kpi.timeframe ?? "this_month",
    operation: kpi.operation,
    operand: kpi.operand ?? 1.0,
    sort_order: kpi.sort_order ?? 0,
  }));

  const { error } = await supabase.from("custom_kpis").insert(rows);
  if (error) throw error;
}
