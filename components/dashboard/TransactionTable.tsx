"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
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

const TYPE_CONFIG: Record<
  TransactionType,
  { label: string; dotClass: string; badgeClass: string }
> = {
  income: {
    label: "Income",
    dotClass: "bg-emerald-500 ring-emerald-500/20",
    badgeClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  expense: {
    label: "Expense",
    dotClass: "bg-rose-500 ring-rose-500/20",
    badgeClass: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  asset: {
    label: "Asset",
    dotClass: "bg-sky-500 ring-sky-500/20",
    badgeClass: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Search, Sort & Pagination state
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

  // Live filter query
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.scope.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
    );
  }, [transactions, searchQuery]);

  // Sorting
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

  // Pagination calculation
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
      return (
        <ArrowUpDown className="h-3 w-3 opacity-30 transition-transform duration-200 group-hover/th:opacity-70" />
      );
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 text-primary transition-all duration-200" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary transition-all duration-200" />
    );
  }

  return (
    <div className="card w-full overflow-hidden border border-base-content/10 bg-base-100 shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Top Toolbar */}
      <div className="border-b border-base-content/5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Header Title + Stats Count Badge */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold tracking-tight text-base-content">
                  Transactions
                </h2>
                <span className="inline-flex items-center rounded-full bg-base-200/80 px-2 py-0.5 text-xs font-semibold text-base-content/70">
                  {transactions.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-base-content/50">
                View, filter, and inspect your latest transactions
              </p>
            </div>
          </div>

          {/* Search + Page Size Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input Bar */}
            <div className="relative flex-1 sm:w-72 sm:flex-initial">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-base-content/40" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="input input-sm w-full rounded-full border-base-content/15 bg-base-200/40 pl-8.5 pr-8 text-xs transition-all duration-200 placeholder:text-base-content/40 focus:border-primary focus:bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery ? (
                <button
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 transition hover:text-base-content"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-base-content/10 bg-base-100 px-1.5 py-0.5 text-[10px] font-medium text-base-content/40 sm:inline-block">
                  /
                </kbd>
              )}
            </div>

            {/* Segmented Page Size Pills */}
            <div className="flex items-center rounded-full border border-base-content/10 bg-base-200/40 p-0.5 text-xs">
              {[10, 25, 50].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
                    pageSize === size
                      ? "bg-base-100 text-base-content shadow-sm ring-1 ring-base-content/5"
                      : "text-base-content/50 hover:text-base-content"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mt-4 py-2 text-xs">
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-base-200/60 p-3.5 text-base-content/40">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-base-content">
              No transactions recorded
            </h3>
            <p className="mt-1 text-xs text-base-content/50 max-w-xs">
              Add your first income, expense, or asset to see it tracked here live.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="rounded-full bg-base-200/50 p-3 text-base-content/40">
              <Search className="h-5 w-5" />
            </div>
            <p className="mt-2 text-xs font-semibold text-base-content">
              No results found
            </p>
            <p className="text-[11px] text-base-content/50">
              No transactions matching &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              className="btn btn-ghost btn-xs mt-3 text-primary hover:underline"
              onClick={() => setSearchQuery("")}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <table className="table w-full text-left text-xs">
            <thead>
              <tr className="border-b border-base-content/10 bg-base-200/30 text-[11px] font-medium tracking-wider uppercase text-base-content/50">
                <th
                  className="group/th cursor-pointer select-none py-3.5 pl-6 transition-colors hover:text-base-content"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-1.5">
                    Title {renderSortIcon("title")}
                  </div>
                </th>
                <th
                  className="group/th cursor-pointer select-none py-3.5 transition-colors hover:text-base-content"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center gap-1.5">
                    Category {renderSortIcon("category")}
                  </div>
                </th>
                <th
                  className="group/th cursor-pointer select-none py-3.5 transition-colors hover:text-base-content"
                  onClick={() => handleSort("type")}
                >
                  <div className="flex items-center gap-1.5">
                    Type {renderSortIcon("type")}
                  </div>
                </th>
                <th className="py-3.5">Scope</th>
                <th
                  className="group/th cursor-pointer select-none py-3.5 transition-colors hover:text-base-content"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center gap-1.5">
                    Amount {renderSortIcon("amount")}
                  </div>
                </th>
                <th
                  className="group/th cursor-pointer select-none py-3.5 transition-colors hover:text-base-content"
                  onClick={() => handleSort("created_at")}
                >
                  <div className="flex items-center gap-1.5">
                    Date {renderSortIcon("created_at")}
                  </div>
                </th>
                <th className="py-3.5 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody
              key={`${pageIndex}-${sortField}-${sortOrder}-${searchQuery}`}
              className="divide-y divide-base-content/5"
            >
              {paginated.map((t, idx) => {
                const typeCfg = TYPE_CONFIG[t.type] ?? TYPE_CONFIG.expense;
                return (
                  <tr
                    key={t.id}
                    className="group transition-all duration-150 hover:bg-base-200/40 animate-in fade-in slide-in-from-bottom-1"
                    style={{ animationDelay: `${idx * 15}ms` }}
                  >
                    {/* Title */}
                    <td className="py-3.5 pl-6 font-medium text-base-content">
                      {t.title}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 text-base-content/70">
                      <span className="inline-flex items-center rounded-md bg-base-200/70 px-2 py-0.5 text-[11px] font-normal text-base-content/80">
                        {t.category}
                      </span>
                    </td>

                    {/* Type pill with glowing dot */}
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${typeCfg.badgeClass}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ring-2 ${typeCfg.dotClass}`}
                        />
                        {typeCfg.label}
                      </span>
                    </td>

                    {/* Scope */}
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          t.scope === "business"
                            ? "bg-secondary/10 text-secondary border border-secondary/20"
                            : "bg-base-200/60 text-base-content/60"
                        }`}
                      >
                        {t.scope}
                      </span>
                    </td>

                    {/* Amount */}
                    <td
                      className={`py-3.5 font-mono text-sm font-semibold tracking-tight tabular-nums ${
                        t.type === "expense"
                          ? "text-rose-600 dark:text-rose-400"
                          : t.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-sky-600 dark:text-sky-400"
                      }`}
                    >
                      {t.type === "expense" ? "-" : "+"}
                      {format(t.amount)}
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap py-3.5 text-[11px] text-base-content/50">
                      {formatDate(t.created_at)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 pr-6 text-right">
                      {confirmId === t.id ? (
                        <div className="flex items-center justify-end gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                          <span className="text-[11px] text-base-content/60">
                            Delete?
                          </span>
                          <button
                            className="btn btn-error btn-xs rounded-full px-2"
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
                            className="btn btn-ghost btn-xs rounded-full px-1.5"
                            onClick={() => setConfirmId(null)}
                            disabled={isPending}
                            aria-label="Cancel delete"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-ghost btn-xs btn-circle text-base-content/30 opacity-70 transition-all duration-150 group-hover:opacity-100 hover:bg-error/10 hover:text-error"
                          onClick={() => {
                            setConfirmId(t.id);
                            setError(null);
                          }}
                          aria-label={`Delete ${t.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modern Bottom Pagination Bar */}
      {filtered.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-base-content/5 bg-base-200/20 px-6 py-3.5 sm:flex-row">
          <p className="text-xs text-base-content/50">
            Showing <span className="font-semibold text-base-content">{startIndex}</span>
            –<span className="font-semibold text-base-content">{endIndex}</span> of{" "}
            <span className="font-semibold text-base-content">{sorted.length}</span>{" "}
            transactions
          </p>

          <div className="flex items-center gap-3">
            {/* Page buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  className="btn btn-ghost btn-xs btn-square rounded-full transition hover:bg-base-200"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pageIndex === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-center gap-1 px-1">
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
                        <span key={p} className="flex items-center">
                          {prev && p - prev > 1 && (
                            <span className="px-1.5 text-xs text-base-content/30">
                              •••
                            </span>
                          )}
                          <button
                            className={`h-6 min-w-6 rounded-full px-1.5 text-[11px] font-semibold transition-all duration-150 ${
                              p === pageIndex
                                ? "bg-primary text-primary-content shadow-sm shadow-primary/30"
                                : "text-base-content/60 hover:bg-base-200 hover:text-base-content"
                            }`}
                            onClick={() => setCurrentPage(p)}
                          >
                            {p}
                          </button>
                        </span>
                      );
                    })}
                </div>

                <button
                  className="btn btn-ghost btn-xs btn-square rounded-full transition hover:bg-base-200"
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

            {/* Load more from database */}
            {nextCursor && (
              <button
                className="btn btn-ghost btn-xs rounded-full text-primary transition hover:bg-primary/10 gap-1.5"
                onClick={handleLoadMore}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Database className="h-3 w-3" />
                )}
                Fetch older records
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}