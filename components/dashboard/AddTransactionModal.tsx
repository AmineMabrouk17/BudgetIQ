"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { createTransaction } from "@/app/actions/transactions";
import type { TransactionScope, TransactionType } from "@/types/transaction";
import CategoryCombobox from "@/components/ui/CategoryCombobox";
import { suggestCategory } from "@/lib/categories";

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
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState("");

  function open() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function close() {
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
      const result = await createTransaction({
        type: formData.get("type") as TransactionType,
        title: formData.get("title") as string,
        amount: Number(formData.get("amount")),
        category: (formData.get("category") as string) || undefined,
        scope: (formData.get("scope") as TransactionScope) || undefined,
      });
      if (result.ok) {
        close();
      } else {
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
              <select className="select select-bordered w-full" name="type" defaultValue="expense" required>
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
              <input
                className="input input-bordered w-full"
                type="number"
                name="amount"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
              />
            </label>
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

            {error && (
              <div className="alert alert-error">
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
              <button className="btn btn-primary" disabled={isPending}>
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
