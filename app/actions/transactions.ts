"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getTransactionsPage,
  insertTransaction,
  removeTransaction,
} from "@/lib/transactions";
import { canonicalizeCategory } from "@/lib/categories";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionScope,
  TransactionType,
} from "@/types/transaction";
export type CreateTransactionResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; error: string };

export type DeleteTransactionResult =
  | { ok: true }
  | { ok: false; error: string };

export type LoadMoreTransactionsResult =
  | { ok: true; transactions: Transaction[]; nextCursor: string | null }
  | { ok: false; error: string };

const TRANSACTION_TYPES: readonly TransactionType[] = [
  "income",
  "expense",
  "asset",
];

const TRANSACTION_SCOPES: readonly TransactionScope[] = [
  "business",
  "personal",
];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function validateCreateInput(input: unknown):
  | { ok: true; data: CreateTransactionInput }
  | { ok: false; error: string } {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid transaction payload." };
  }

  const { type, title, amount, category, scope } = input as Record<
    string,
    unknown
  >;

  if (!TRANSACTION_TYPES.includes(type as TransactionType)) {
    return { ok: false, error: "Type must be income, expense, or asset." };
  }

  if (scope !== undefined && scope !== null) {
    if (!TRANSACTION_SCOPES.includes(scope as TransactionScope)) {
      return { ok: false, error: "Scope must be business or personal." };
    }
  }

  if (typeof title !== "string" || title.trim().length === 0) {
    return { ok: false, error: "Title is required." };
  }
  if (title.trim().length > 255) {
    return { ok: false, error: "Title must be 255 characters or fewer." };
  }

  const parsedAmount = parseAmount(amount);
  if (parsedAmount === null) {
    return { ok: false, error: "Amount must be a valid number." };
  }
  if (parsedAmount <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  if (category !== undefined && typeof category !== "string") {
    return { ok: false, error: "Category must be a string." };
  }
  const trimmedCategory = (category ?? "").trim();
  if (trimmedCategory.length > 100) {
    return { ok: false, error: "Category must be 100 characters or fewer." };
  }

  return {
    ok: true,
    data: {
      type: type as TransactionType,
      title: title.trim(),
      amount: parsedAmount,
      category: trimmedCategory === "" ? undefined : trimmedCategory,
      scope: scope === undefined ? undefined : (scope as TransactionScope),
    },
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<CreateTransactionResult> {
  const parsed = validateCreateInput(input);
  if (!parsed.ok) return parsed;

  try {
    const transaction = await insertTransaction({
      ...parsed.data,
      category: canonicalizeCategory(parsed.data.category),
    });
    revalidatePath("/dashboard");
    return { ok: true, transaction };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteTransaction(
  id: string
): Promise<DeleteTransactionResult> {
  if (typeof id !== "string" || !UUID_REGEX.test(id)) {
    return { ok: false, error: "Invalid transaction id." };
  }

  try {
    await removeTransaction(id);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function loadMoreTransactions(
  cursor: string,
  scope: TransactionScope | null = null
): Promise<LoadMoreTransactionsResult> {
  if (typeof cursor !== "string" || cursor.length === 0 || cursor.length > 512) {
    return { ok: false, error: "Invalid cursor." };
  }
  if (scope !== null && !TRANSACTION_SCOPES.includes(scope)) {
    return { ok: false, error: "Invalid scope." };
  }

  try {
    const page = await getTransactionsPage(cursor, scope);
    return {
      ok: true,
      transactions: page.transactions,
      nextCursor: page.nextCursor,
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export type UserCategoriesResult =
  | { ok: true; distinct: string[]; topFour: string[] }
  | { ok: false; error: string };

export async function getUserCategories(): Promise<UserCategoriesResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const { data: rows, error: queryErr } = await supabase
      .from("transactions")
      .select("category")
      .eq("user_id", user.id);

    if (queryErr) throw queryErr;

    const distinct = [
      ...new Set(
        (rows ?? [])
          .map((r) => (r.category ?? "").trim())
          .filter((c) => c.length > 0)
      ),
    ].sort();

    const counts = new Map<string, number>();
    for (const row of rows ?? []) {
      const cat = (row.category ?? "").trim();
      if (cat.length === 0) continue;
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }

    const topFour = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cat]) => cat);

    return { ok: true, distinct, topFour };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
