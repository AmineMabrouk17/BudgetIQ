import { createClient } from "@/lib/supabase/server";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionType,
} from "@/types/transaction";

export type Summary = {
  netBalance: number;
  monthlySpending: number;
  totalAssets: number;
};

export function computeSummary(
  transactions: Transaction[],
  now: Date = new Date()
): Summary {
  let income = 0;
  let expenses = 0;
  let totalAssets = 0;
  let monthlySpending = 0;

  const year = now.getFullYear();
  const month = now.getMonth();

  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") {
      expenses += t.amount;
      const date = new Date(t.created_at);
      if (date.getFullYear() === year && date.getMonth() === month) {
        monthlySpending += t.amount;
      }
    } else if (t.type === "asset") totalAssets += t.amount;
  }

  return {
    netBalance: income + totalAssets - expenses,
    monthlySpending,
    totalAssets,
  };
}

type TransactionRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  amount: string;
  category: string;
  created_at: string;
};

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as TransactionType,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    created_at: row.created_at,
  };
}

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("transactions")
    .select("id, user_id, type, title, amount, category, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toTransaction);
}

export async function insertTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const row = {
    user_id: user.id,
    type: input.type,
    title: input.title,
    amount: input.amount,
    category: input.category ?? "General",
    ...(input.id ? { id: input.id } : {}),
  };

  const query = input.id
    ? supabase
        .from("transactions")
        .upsert(row, { onConflict: "id" })
    : supabase.from("transactions").insert(row);

  const { data, error } = await query.select().single();

  if (error) throw error;
  return toTransaction(data);
}

export async function removeTransaction(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw error;
  if (data.length === 0) throw new Error("Transaction not found");
}
