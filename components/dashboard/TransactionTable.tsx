"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Trash2, X } from "lucide-react";
import type { Transaction, TransactionType } from "@/types/transaction";
import {
  deleteTransaction,
  loadMoreTransactions,
} from "@/app/actions/transactions";
import AddTransactionModal from "@/components/dashboard/AddTransactionModal";
import { useCurrencyFormatter } from "@/lib/use-display-currency";

const TYPE_BADGES: Record<TransactionType, string> = {
  income: "badge-success",
  expense: "badge-error",
  asset: "badge-info",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TransactionTable({
  transactions: initialTransactions,
  nextCursor: initialCursor,
}: {
  transactions: Transaction[];
  nextCursor: string | null;
}) {
  const format = useCurrencyFormatter();
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTransaction(id);
      if (!result.ok) {
        setError(result.error);
      }
      setConfirmId(null);
    });
  }

  function handleLoadMore() {
    if (!nextCursor) return;
    const cursor = nextCursor;
    setError(null);
    startTransition(async () => {
      const result = await loadMoreTransactions(cursor);
      if (result.ok) {
        setTransactions((prev) => [...prev, ...result.transactions]);
        setNextCursor(result.nextCursor);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="card w-full bg-base-100 shadow">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title">Transactions</h2>
          <AddTransactionModal />
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-base-content/60">
              No transactions yet. Add your first income, expense, or asset.
            </p>
            <AddTransactionModal />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.title}</td>
                    <td>{t.category}</td>
                    <td>
                      <span className={`badge ${TYPE_BADGES[t.type]}`}>
                        {t.type}
                      </span>
                    </td>
                    <td
                      className={
                        t.type === "expense"
                          ? "font-semibold text-error"
                          : t.type === "income"
                            ? "font-semibold text-success"
                            : "font-semibold"
                      }
                    >
                      {format(t.amount)}
                    </td>
                    <td className="whitespace-nowrap text-base-content/70">
                      {formatDate(t.created_at)}
                    </td>
                    <td className="text-right">
                      {confirmId === t.id ? (
                        <div className="flex justify-end gap-2">
                          <span className="text-sm text-base-content/70">
                            Delete?
                          </span>
                          <button
                            className="btn btn-error btn-xs"
                            onClick={() => handleDelete(t.id)}
                            disabled={isPending}
                            aria-label={`Confirm delete of ${t.title}`}
                          >
                            {isPending ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Check />
                            )}
                            Yes
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => setConfirmId(null)}
                            disabled={isPending}
                            aria-label="Cancel delete"
                          >
                            <X />
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => {
                            setConfirmId(t.id);
                            setError(null);
                          }}
                          aria-label={`Delete ${t.title}`}
                        >
                          <Trash2 />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {nextCursor && (
          <div className="flex justify-center pt-2">
            <button
              className="btn btn-outline btn-sm"
              onClick={handleLoadMore}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
