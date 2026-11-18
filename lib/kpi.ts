import { createClient } from "@/lib/supabase/server";
import { DEFAULT_KPIS } from "@/lib/kpi-defaults";
import type { CreateCustomKPIInput } from "@/types/kpi";

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
