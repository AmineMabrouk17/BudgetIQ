"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import type { ParsedTransactionAction } from "@/lib/gemini";
import { createTransaction } from "@/app/actions/transactions";
import { useCurrencyFormatter } from "@/lib/currency";

const TYPE_LABELS: Record<ParsedTransactionAction["type"], string> = {
  income: "Add Income",
  expense: "Add Expense",
  asset: "Add Asset",
};

export default function TransactionActionCard({
  action,
}: {
  action: ParsedTransactionAction;
}) {
  const format = useCurrencyFormatter();
  const idRef = useRef<string>(crypto.randomUUID());
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await createTransaction({
        type: action.type,
        title: action.title,
        amount: action.amount,
        category: action.category,
        id: idRef.current,
      });
      if (result.ok) {
        setStatus("added");
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  if (status === "added") {
    return (
      <div className="alert alert-success mt-2 max-w-xs">
        <Check />
        <span>
          Added {action.title} ({format(action.amount)})
        </span>
      </div>
    );
  }

  return (
    <div className="card mt-2 max-w-xs border border-base-300 bg-base-100">
      <div className="card-body gap-2 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
          Detected transaction
        </p>
        <p className="font-medium">
          {action.title} — {format(action.amount)}
        </p>
        {action.category && (
          <p className="text-xs text-base-content/60">
            Category: {action.category} · Type: {action.type}
          </p>
        )}
        {error && (
          <p className="text-xs text-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAdd}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          {TYPE_LABELS[action.type]}
        </button>
      </div>
    </div>
  );
}
