"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTransactions } from "@/lib/transactions";
import { evaluateKPIs, type EvaluatedKPI } from "@/lib/kpi-calculator";
import type {
  CustomKPI,
  KpiOperation,
  KpiScope,
  KpiSource,
  KpiTimeframe,
} from "@/types/kpi";

export type ListKpisResult =
  | { ok: true; kpis: EvaluatedKPI[] }
  | { ok: false; error: string };

export type UpsertKpiResult = { ok: true } | { ok: false; error: string };

export type DeleteKpiResult = { ok: true } | { ok: false; error: string };

const KPI_SOURCES: readonly KpiSource[] = [
  "income",
  "expense",
  "balance",
  "category",
];

const KPI_SCOPES: readonly KpiScope[] = ["all", "personal", "business"];

const KPI_TIMEFRAMES: readonly KpiTimeframe[] = [
  "this_month",
  "last_month",
  "last_30_days",
  "year_to_date",
  "all_time",
];

const KPI_OPERATIONS: readonly KpiOperation[] = [
  "sum",
  "percentage",
  "budget_remaining",
];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CustomKpiRow = {
  id: string;
  user_id: string;
  title: string;
  source_type: string;
  category_filter: string | null;
  scope: string;
  timeframe: string;
  operation: string;
  operand: string | number;
  sort_order: number;
  created_at: string;
};

function toCustomKPI(row: CustomKpiRow): CustomKPI {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    source_type: row.source_type as KpiSource,
    category_filter: row.category_filter,
    scope: row.scope as KpiScope,
    timeframe: row.timeframe as KpiTimeframe,
    operation: row.operation as KpiOperation,
    operand: Number(row.operand),
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export type UpsertCustomKPIInput = {
  id?: string;
  title: string;
  source_type: KpiSource;
  category_filter?: string | null;
  scope?: KpiScope;
  timeframe?: KpiTimeframe;
  operation: KpiOperation;
  operand?: number;
};

function validateUpsertInput(input: unknown):
  | { ok: true; data: UpsertCustomKPIInput }
  | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid KPI payload." };
  }

  const {
    id,
    title,
    source_type,
    category_filter,
    scope,
    timeframe,
    operation,
    operand,
  } = input as Record<string, unknown>;

  if (id !== undefined && (typeof id !== "string" || !UUID_REGEX.test(id))) {
    return { ok: false, error: "Invalid KPI id." };
  }

  if (!KPI_SOURCES.includes(source_type as KpiSource)) {
    return {
      ok: false,
      error: "Source must be income, expense, balance, or category.",
    };
  }

  if (
    scope !== undefined &&
    scope !== null &&
    !KPI_SCOPES.includes(scope as KpiScope)
  ) {
    return { ok: false, error: "Scope must be all, personal, or business." };
  }

  if (
    timeframe !== undefined &&
    timeframe !== null &&
    !KPI_TIMEFRAMES.includes(timeframe as KpiTimeframe)
  ) {
    return { ok: false, error: "Timeframe is invalid." };
  }

  if (!KPI_OPERATIONS.includes(operation as KpiOperation)) {
    return {
      ok: false,
      error: "Operation must be sum, percentage, or budget_remaining.",
    };
  }

  if (typeof title !== "string" || title.trim().length === 0) {
    return { ok: false, error: "Title is required." };
  }
  if (title.trim().length > 60) {
    return { ok: false, error: "Title must be 60 characters or fewer." };
  }

  if (category_filter !== undefined && typeof category_filter !== "string") {
    return { ok: false, error: "Category must be a string." };
  }
  const trimmedCategory = (category_filter ?? "").trim();
  if (source_type === "category" && trimmedCategory.length === 0) {
    return { ok: false, error: "Category is required for category source." };
  }
  if (trimmedCategory.length > 100) {
    return { ok: false, error: "Category must be 100 characters or fewer." };
  }

  const parsedOperand =
    operand === undefined ? 1.0 : parseNumber(operand);
  if (parsedOperand === null) {
    return { ok: false, error: "Operand must be a valid number." };
  }

  return {
    ok: true,
    data: {
      id: id === undefined ? undefined : (id as string),
      title: title.trim(),
      source_type: source_type as KpiSource,
      category_filter:
        source_type === "category" ? trimmedCategory : null,
      scope:
        scope === undefined || scope === null
          ? undefined
          : (scope as KpiScope),
      timeframe:
        timeframe === undefined || timeframe === null
          ? undefined
          : (timeframe as KpiTimeframe),
      operation: operation as KpiOperation,
      operand: parsedOperand,
    },
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export async function listCustomKPIs(): Promise<ListKpisResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  try {
    const { data, error } = await supabase
      .from("custom_kpis")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const kpis = (data ?? []).map(toCustomKPI);
    const transactions = await getTransactions();
    return { ok: true, kpis: evaluateKPIs(kpis, transactions) };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function upsertCustomKPI(
  input: UpsertCustomKPIInput
): Promise<UpsertKpiResult> {
  const parsed = validateUpsertInput(input);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const row = {
    user_id: user.id,
    title: parsed.data.title,
    source_type: parsed.data.source_type,
    category_filter: parsed.data.category_filter,
    scope: parsed.data.scope ?? "all",
    timeframe: parsed.data.timeframe ?? "this_month",
    operation: parsed.data.operation,
    operand: parsed.data.operand,
  };

  try {
    if (parsed.data.id) {
      const { error } = await supabase
        .from("custom_kpis")
        .update(row)
        .eq("id", parsed.data.id)
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("custom_kpis").insert(row);
      if (error) throw error;
    }
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteCustomKPI(id: string): Promise<DeleteKpiResult> {
  if (typeof id !== "string" || !UUID_REGEX.test(id)) {
    return { ok: false, error: "Invalid KPI id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  try {
    const { data, error } = await supabase
      .from("custom_kpis")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("KPI not found");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
