import { createClient } from "@/lib/supabase/server";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionType,
} from "@/types/transaction";

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

export const TRANSACTION_PAGE_SIZE = 100;

export type TransactionPage = {
  transactions: Transaction[];
  nextCursor: string | null;
};

type PageCursor = { created_at: string; id: string };

function encodeCursor(cursor: PageCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(raw: string): PageCursor {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.created_at === "string" &&
      typeof parsed.id === "string"
    ) {
      return parsed as PageCursor;
    }
  } catch {
    // fall through to thrown error
  }
  throw new Error("Invalid transaction cursor");
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

export async function getTransactionsPage(
  cursor?: string
): Promise<TransactionPage> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let query = supabase
    .from("transactions")
    .select("id, user_id, type, title, amount, category, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(TRANSACTION_PAGE_SIZE + 1);

  if (cursor) {
    const parsed = decodeCursor(cursor);
    query = query.or(
      `created_at.lt.${parsed.created_at},and(created_at.eq.${parsed.created_at},id.lt.${parsed.id})`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > TRANSACTION_PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, TRANSACTION_PAGE_SIZE) : rows;

  const last = pageRows[pageRows.length - 1];
  return {
    transactions: pageRows.map(toTransaction),
    nextCursor:
      hasMore && last
        ? encodeCursor({
            created_at: last.created_at,
            id: last.id,
          })
        : null,
  };
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
