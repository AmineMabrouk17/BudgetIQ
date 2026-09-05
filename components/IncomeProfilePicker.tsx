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

const PAY_CYCLE_TYPES: IncomeType[] = ["salaried", "hourly"];

export default function IncomeProfilePicker({
  initialIncomeType = null,
  initialPayday = null,
  initialExpectedIncome = null,
  variant = "step",
}: {
  initialIncomeType?: IncomeType | null;
  initialPayday?: number | null;
  initialExpectedIncome?: number | null;
  variant?: "step" | "menu";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<IncomeType | null>(
    initialIncomeType
  );
  const [payday, setPayday] = useState<string>(
    initialPayday !== null ? String(initialPayday) : ""
  );
  const [expectedIncome, setExpectedIncome] = useState<string>(
    initialExpectedIncome !== null ? String(initialExpectedIncome) : ""
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!selected) {
      setError("Pick an income type to continue.");
      return;
    }
    setError(null);

    const isPayCycleType = PAY_CYCLE_TYPES.includes(selected);
    const paydayValue = payday.trim();
    const expectedIncomeValue = expectedIncome.trim();
    const options: { payday?: number; expected_income?: number } = {};
    if (isPayCycleType && paydayValue !== "") {
      options.payday = parseInt(paydayValue, 10);
    }
    if (isPayCycleType && expectedIncomeValue !== "") {
      options.expected_income = parseFloat(expectedIncomeValue);
    }

    startTransition(async () => {
      const result = await updateIncomeProfile(selected, options);
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

  const payCycleFields = selected && PAY_CYCLE_TYPES.includes(selected);

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

      {payCycleFields && (
        <div
          className={
            variant === "menu"
              ? "mt-3 grid gap-2"
              : "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          }
        >
          <label className="form-control">
            <span className="label-text mb-1 text-xs font-semibold text-base-content/70">
              Payday (day of month)
            </span>
            <input
              type="number"
              name="payday"
              min={1}
              max={31}
              step={1}
              inputMode="numeric"
              value={payday}
              onChange={(e) => setPayday(e.target.value)}
              placeholder="e.g. 28"
              className="input input-bordered input-sm"
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1 text-xs font-semibold text-base-content/70">
              Expected income per pay period
            </span>
            <input
              type="number"
              name="expected_income"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={expectedIncome}
              onChange={(e) => setExpectedIncome(e.target.value)}
              placeholder="e.g. 5000"
              className="input input-bordered input-sm"
            />
          </label>
          <p className="text-xs text-base-content/50 sm:col-span-2">
            Used to track pay-cycle progress on your dashboard. Leave blank to
            keep your current values.
          </p>
        </div>
      )}

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