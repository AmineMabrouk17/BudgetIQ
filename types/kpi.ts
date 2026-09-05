export type KpiSource = "income" | "expense" | "balance" | "category";
export type KpiScope = "all" | "personal" | "business";
export type KpiTimeframe =
  | "this_month"
  | "last_month"
  | "last_30_days"
  | "year_to_date"
  | "all_time";
export type KpiOperation = "sum" | "percentage" | "budget_remaining";

export type CustomKPI = {
  id: string;
  user_id: string;
  title: string;
  source_type: KpiSource;
  category_filter: string | null;
  scope: KpiScope;
  timeframe: KpiTimeframe;
  operation: KpiOperation;
  operand: number;
  sort_order: number;
  created_at: string;
};

export type CreateCustomKPIInput = {
  title: string;
  source_type: KpiSource;
  category_filter?: string | null;
  scope?: KpiScope;
  timeframe?: KpiTimeframe;
  operation: KpiOperation;
  operand?: number;
  sort_order?: number;
};
