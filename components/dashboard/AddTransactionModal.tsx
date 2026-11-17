"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { createTransaction } from "@/app/actions/transactions";
import type { TransactionScope, TransactionType } from "@/types/transaction";
import CategoryCombobox from "@/components/ui/CategoryCombobox";
import { suggestCategory } from "@/lib/categories";
import { BASE_CURRENCY, type CurrencyRates } from "@/lib/currency";
import {
  useDisplayCurrency,
  loadRates,
} from "@/lib/currency/use-display-currency";

const TYPES: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "asset", label: "Asset" },
];

const SCOPES: { value: TransactionScope; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
];

export default function AddTransactionModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState("");
  const displayCurrency = useDisplayCurrency();
  const [rates, setRates] = useState<CurrencyRates | null>(null);

  function clearAutoClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function scheduleAutoClose() {
    clearAutoClose();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setSaved(false);
      dialogRef.current?.close();
    }, 2500);
  }

  useEffect(() => {
    return clearAutoClose;
  }, []);

  useEffect(() => {
    let active = true;
    if (displayCurrency === BASE_CURRENCY) return;

    loadRates().then((loaded) => {
      if (active) {
        setRates(loaded);
      }
    });

    return () => {
      active = false;
    };
  }, [displayCurrency]);

  const isNonUsd = displayCurrency !== BASE_CURRENCY;
  const rateToUsd = rates?.[displayCurrency] ?? null;
  const isLoadingRates = isNonUsd && rates === null;
  const isRateUnavailable =
    !isLoadingRates && isNonUsd && (rateToUsd === null || rateToUsd <= 0);
  const canSave = !isRateUnavailable;

  function open() {
    clearAutoClose();
    setSaved(false);
    setError(null);
    dialogRef.current?.showModal();
  }

  function close() {
    clearAutoClose();
    setSaved(false);
    dialogRef.current?.close();
  }

  function handleTitleBlur() {
    if (category) return;
    const title = titleRef.current?.value ?? "";
    if (title.trim().length === 0) return;
    const suggested = suggestCategory(title);
    if (suggested) setCategory(suggested);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      let rawAmount = Number(formData.get("amount"));
      if (isNonUsd) {
        const activeRates = rates ?? (await loadRates());
        const rate = activeRates?.[displayCurrency] ?? null;
        if (!rate || rate <= 0) {
          setError(
            `Exchange rate for ${displayCurrency} is unavailable. Saving transactions in this currency is unavailable.`
          );
          return;
        }
        rawAmount = rawAmount / rate;
      }
      const result = await createTransaction({
        type: formData.get("type") as TransactionType,
        title: formData.get("title") as string,
        amount: rawAmount,
        category: (formData.get("category") as string) || undefined,
        scope: (formData.get("scope") as TransactionScope) || undefined,
      });
      if (result.ok) {
        setSaved(true);
        setError(null);
        // Re-render the streamed dashboard sections from the server so the new
        // row reaches TransactionTable without a manual browser reload.
        router.refresh();
        scheduleAutoClose();
      } else {
        setSaved(false);
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button className="btn btn-primary" onClick={open}>
        <Plus />
        Add transaction
      </button>

      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="mb-4 text-lg font-bold">Add transaction</h3>
          <form action={handleSubmit} className="flex flex-col gap-3">
            <label className="form-control w-full">
              <span className="label-text mb-1">Type</span>
              <select
                className="select select-bordered w-full"
                name="type"
                defaultValue="expense"
                required
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control w-full">
              <span className="label-text mb-1">Title</span>
              <input
                ref={titleRef}
                className="input input-bordered w-full"
                type="text"
                name="title"
                placeholder="e.g. Groceries"
                maxLength={255}
                required
                onBlur={handleTitleBlur}
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text mb-1">Amount</span>
              <div className="join w-full">
                <span className="join-item btn btn-sm pointer-events-none">
                  {displayCurrency}
                </span>
                <input
                  className="input input-bordered join-item w-full"
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </label>

            {isRateUnavailable && (
              <div className="alert alert-warning">
                <span>
                  Exchange rate for {displayCurrency} is unavailable. Saving
                  transactions in {displayCurrency} is unavailable.
                </span>
              </div>
            )}

            <label className="form-control w-full">
              <span className="label-text mb-1">Scope</span>
              <select
                className="select select-bordered w-full"
                name="scope"
                defaultValue="personal"
              >
                {SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-control w-full">
              <span className="label-text mb-1">Category</span>
              <CategoryCombobox name="category" value={category} />
            </label>

            {/* Keep the live region mounted so assistive tech announces the
                message when it changes, rather than when the node is inserted. */}
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={saved ? "alert alert-success" : "sr-only"}
            >
              {saved ? (
                <>
                  <span>Transaction added. Your dashboard is up to date.</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={close}
                  >
                    Done
                  </button>
                </>
              ) : null}
            </div>

            {error && (
              <div role="alert" className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={close}
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={isPending || !canSave}
              >
                {isPending ? <Loader2 className="animate-spin" /> : null}
                Save
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}