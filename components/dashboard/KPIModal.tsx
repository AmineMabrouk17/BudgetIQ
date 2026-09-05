"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { upsertCustomKPI } from "@/app/actions/kpis";
import type { EvaluatedKPI } from "@/lib/kpi-calculator";
import type {
  KpiOperation,
  KpiScope,
  KpiSource,
  KpiTimeframe,
} from "@/types/kpi";

const SOURCES: { value: KpiSource; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "balance", label: "Balance" },
  { value: "category", label: "Category" },
];

const SCOPES: { value: KpiScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
];

const TIMEFRAMES: { value: KpiTimeframe; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "year_to_date", label: "Year to date" },
  { value: "all_time", label: "All time" },
];

const OPERATIONS: { value: KpiOperation; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "percentage", label: "Percentage" },
  { value: "budget_remaining", label: "Budget remaining" },
];

type KpiForm = {
  title: string;
  source_type: KpiSource;
  category_filter: string;
  scope: KpiScope;
  timeframe: KpiTimeframe;
  operation: KpiOperation;
  operand: string;
};

function toForm(kpi: EvaluatedKPI | null): KpiForm {
  const k = kpi?.kpi;
  return {
    title: k?.title ?? "",
    source_type: k?.source_type ?? "income",
    category_filter: k?.category_filter ?? "",
    scope: k?.scope ?? "all",
    timeframe: k?.timeframe ?? "this_month",
    operation: k?.operation ?? "sum",
    operand: k ? String(k.operand) : "1",
  };
}

export default function KpiModal({
  open,
  kpi,
  onClose,
  onSaved,
}: {
  open: boolean;
  kpi: EvaluatedKPI | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<KpiForm>(() => toForm(kpi));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else dialog.close();
  }, [open]);

  function setField<K extends keyof KpiForm>(key: K, value: KpiForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await upsertCustomKPI({
        id: kpi?.kpi.id,
        title: form.title,
        source_type: form.source_type,
        category_filter: form.category_filter || undefined,
        scope: form.scope,
        timeframe: form.timeframe,
        operation: form.operation,
        operand: Number(form.operand),
      });
      if (result.ok) {
        onClose();
        onSaved();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="mb-4 text-lg font-bold">
          {kpi ? "Edit KPI" : "Add KPI"}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="form-control w-full">
            <span className="label-text mb-1">Title</span>
            <input
              className="input input-bordered w-full"
              type="text"
              name="title"
              placeholder="e.g. Groceries this month"
              maxLength={60}
              required
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
            />
          </label>

          <label className="form-control w-full">
            <span className="label-text mb-1">Source data</span>
            <select
              className="select select-bordered w-full"
              name="source_type"
              value={form.source_type}
              onChange={(e) =>
                setField("source_type", e.target.value as KpiSource)
              }
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {form.source_type === "category" && (
            <label className="form-control w-full">
              <span className="label-text mb-1">Category</span>
              <input
                className="input input-bordered w-full"
                type="text"
                name="category_filter"
                placeholder="e.g. Food, Rent, Salary"
                maxLength={100}
                required
                value={form.category_filter}
                onChange={(e) => setField("category_filter", e.target.value)}
              />
            </label>
          )}

          <label className="form-control w-full">
            <span className="label-text mb-1">Scope</span>
            <select
              className="select select-bordered w-full"
              name="scope"
              value={form.scope}
              onChange={(e) => setField("scope", e.target.value as KpiScope)}
            >
              {SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control w-full">
            <span className="label-text mb-1">Timeframe</span>
            <select
              className="select select-bordered w-full"
              name="timeframe"
              value={form.timeframe}
              onChange={(e) =>
                setField("timeframe", e.target.value as KpiTimeframe)
              }
            >
              {TIMEFRAMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control w-full">
            <span className="label-text mb-1">Operation</span>
            <select
              className="select select-bordered w-full"
              name="operation"
              value={form.operation}
              onChange={(e) =>
                setField("operation", e.target.value as KpiOperation)
              }
            >
              {OPERATIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control w-full">
            <span className="label-text mb-1">Operand</span>
            <input
              className="input input-bordered w-full"
              type="number"
              name="operand"
              step="any"
              required
              value={form.operand}
              onChange={(e) => setField("operand", e.target.value)}
            />
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
              onClick={onClose}
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
  );
}
