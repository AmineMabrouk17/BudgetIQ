"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateIncomeProfile } from "@/app/actions/profiles";
import type { IncomeType } from "@/lib/profiles";

const INCOME_TYPE_OPTIONS: { value: IncomeType; title: string; description: string }[] = [
  {
    value: "salaried",
    title: "Salaried",
    description: "A consistent monthly paycheck on a fixed schedule.",
  },
  {
    value: "hourly",
    title: "Hourly",
    description: "Paid per hour worked; earnings vary week to week.",
  },
  {
    value: "freelancer",
    title: "Freelancer",
    description: "Independent projects and gigs with irregular income.",
  },
  {
    value: "business",
    title: "Business",
    description: "Revenue from a business you own and operate.",
  },
];

export default function IncomeProfilePicker({
  initialIncomeType = null,
  variant = "step",
}: {
  initialIncomeType?: IncomeType | null;
  variant?: "step" | "menu";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<IncomeType | null>(
    initialIncomeType
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!selected) {
      setError("Pick an income type to continue.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateIncomeProfile(selected);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const listClass =
    variant === "menu"
      ? "space-y-1"
      : "grid grid-cols-1 gap-3 sm:grid-cols-2";

  return (
    <form
      action={handleSubmit}
      className={variant === "menu" ? "p-2" : "w-full max-w-2xl"}
      aria-label="Income profile"
    >
      <div className={listClass}>
        {INCOME_TYPE_OPTIONS.map((option) => {
          const active = selected === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-box border p-3 transition ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-base-300 bg-base-100 hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="income_type"
                value={option.value}
                checked={active}
                onChange={() => setSelected(option.value)}
                className="radio radio-primary mt-0.5"
              />
              <span>
                <span className="block text-sm font-semibold text-base-content">
                  {option.title}
                </span>
                <span className="block text-xs text-base-content/60">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={isPending || !selected}
        >
          {isPending ? "Saving…" : "Save income profile"}
        </button>
      </div>
    </form>
  );
}