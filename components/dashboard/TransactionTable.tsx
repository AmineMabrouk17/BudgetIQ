"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type {
  Transaction,
  TransactionScope,
  TransactionType,
} from "@/types/transaction";
import {
  deleteTransaction,
  loadMoreTransactions,
} from "@/app/actions/transactions";
import { useCurrencyFormatter } from "@/lib/currency/use-display-currency";
import { formatDate } from "@/lib/format";

const TYPE_BADGES: Record<TransactionType, string> = {
  income: "badge-success",
  expense: "badge-error",
  asset: "badge-info",
};

const SCOPE_BADGES: Record<Transaction["scope"], string> = {
  business: "badge-secondary",
  personal: "badge-ghost",
};

type SortField = "title" | "category" | "type" | "amount" | "created_at";
type SortOrder = "asc" | "desc";

export default function TransactionTable({
  transactions: initialTransactions,
  nextCursor: initialCursor,
  scope,
}: {
  transactions: Transaction[];
  nextCursor: string | null;
  scope: TransactionScope | null;
}) {
  const format = useCurrencyFormatter();
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Search & Sorting & Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTransaction(id);
      if (!result.ok) {
        setError(result.error);
      } else {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      }
      setConfirmId(null);
    });
  }

  function handleLoadMore() {
    if (!nextCursor) return;
    const cursor = nextCursor;
    setError(null);
    startTransition(async () => {
      const result = await loadMoreTransactions(cursor, scope);
      if (result.ok) {
        setTransactions((prev) => [...prev, ...result.transactions]);
        setNextCursor(result.nextCursor);
      } else {
        setError(result.error);
      }
    });
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "created_at" ? "desc" : "asc");
    }
    setCurrentPage(1);
  }

  // Filter transactions based on search query
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
    );
  }, [transactions, searchQuery]);

  // Sort filtered transactions
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "created_at") {
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "amount") {
        cmp = a.amount - b.amount;
      } else if (sortField === "title") {
        cmp = a.title.localeCompare(b.title);
      } else if (sortField === "category") {
        cmp = a.category.localeCompare(b.category);
      } else if (sortField === "type") {
        cmp = a.type.localeCompare(b.type);
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortOrder]);

  // Paginate transactions
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageIndex, pageSize]);

  const startIndex = sorted.length === 0 ? 0 : (pageIndex - 1) * pageSize + 1;
  const endIndex = Math.min(pageIndex * pageSize, sorted.length);

  function renderSortIcon(field: SortField) {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" />
    );
  }

  return (
    <div className="card w-full border border-base-content/5 bg-base-100 shadow-sm">
      <div className="card-body p-6">
        {/* Header & Search Bar Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-base-content">
              Transactions
            </h2>
            <p className="text-xs text-base-content/60">
              Manage, search, and track all your logged records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search title, category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="input input-bordered input-sm w-full pl-9 pr-8"
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="select select-bordered select-sm text-xs"
              aria-label="Rows per page"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mt-3 py-2 text-sm">
            <span>{error}</span>
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-base-content/60">
              No transactions yet. Add your first income, expense, or asset.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm font-medium text-base-content/70">
              No transactions matching &quot;{searchQuery}&quot;
            </p>
            <button
              className="btn btn-ghost btn-xs text-primary"
              onClick={() => setSearchQuery("")}
            >
              Reset search
            </button>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="table table-zebra w-full text-left">
              <thead>
                <tr className="border-b border-base-content/10 text-xs font-semibold text-base-content/70">
                  <th
                    className="cursor-pointer select-none transition hover:text-base-content"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1.5">
                      Title {renderSortIcon("title")}
                    </div>
                  </th>
                  <th
                    className="cursor-pointer select-none transition hover:text-base-content"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-1.5">
                      Category {renderSortIcon("category")}
                    </div>
                  </th>
                  <th
                    className="cursor-pointer select-none transition hover:text-base-content"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center gap-1.5">
                      Type {renderSortIcon("type")}
                    </div>
                  </th>
                  <th>Scope</th>
                  <th
                    className="cursor-pointer select-none transition hover:text-base-content"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center gap-1.5">
                      Amount {renderSortIcon("amount")}
                    </div>
                  </th>
                  <th
                    className="cursor-pointer select-none transition hover:text-base-content"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-1.5">
                      Date {renderSortIcon("created_at")}
                    </div>
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id} className="hover:bg-base-200/40">
                    <td className="font-medium text-base-content">{t.title}</td>
                    <td>{t.category}</td>
                    <td>
                      <span
                        className={`badge badge-sm uppercase font-semibold text-[10px] ${TYPE_BADGES[t.type]}`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm uppercase font-semibold text-[10px] ${SCOPE_BADGES[t.scope]}`}
                      >
                        {t.scope}
                      </span>
                    </td>
                    <td
                      className={`font-semibold ${
                        t.type === "expense"
                          ? "text-error"
                          : t.type === "income"
                            ? "text-success"
                            : "text-info"
                      }`}
                    >
                      {format(t.amount)}
                    </td>
                    <td className="whitespace-nowrap text-xs text-base-content/70">
                      {formatDate(t.created_at)}
                    </td>
                    <td className="text-right">
                      {confirmId === t.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs text-base-content/70">
                            Delete?
                          </span>
                          <button
                            className="btn btn-error btn-xs"
                            onClick={() => handleDelete(t.id)}
                            disabled={isPending}
                            aria-label={`Confirm delete of ${t.title}`}
                          >
                            {isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Yes
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => setConfirmId(null)}
                            disabled={isPending}
                            aria-label="Cancel delete"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-error"
                          onClick={() => {
                            setConfirmId(t.id);
                            setError(null);
                          }}
                          aria-label={`Delete ${t.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Footer Controls */}
        {filtered.length > 0 && (
          <div className="mt-5 flex flex-col items-center justify-between gap-3 pt-3 sm:flex-row border-t border-base-content/10">
            <span className="text-xs text-base-content/60">
              Showing <span className="font-semibold">{startIndex}</span>–
              <span className="font-semibold">{endIndex}</span> of{" "}
              <span className="font-semibold">{sorted.length}</span>{" "}
              transactions
            </span>

            <div className="flex items-center gap-3">
              {/* Pagination buttons */}
              {totalPages > 1 && (
                <div className="join">
                  <button
                    className="btn btn-outline btn-xs join-item"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pageIndex === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - pageIndex) <= 1
                    )
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      return (
                        <span key={p} className="flex">
                          {prev && p - prev > 1 && (
                            <button
                              disabled
                              className="btn btn-outline btn-xs join-item"
                            >
                              ...
                            </button>
                          )}
                          <button
                            className={`btn btn-xs join-item ${
                              p === pageIndex
                                ? "btn-primary"
                                : "btn-outline"
                            }`}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </button>
                        </span>
                      );
                    })}

                  <button
                    className="btn btn-outline btn-xs join-item"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={pageIndex === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Load older from DB button */}
              {nextCursor && (
                <button
                  className="btn btn-ghost btn-xs text-primary gap-1"
                  onClick={handleLoadMore}
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Fetch older batch
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}