"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TransactionScope } from "@/types/transaction";

export type ScopeFilterValue = TransactionScope | "all";

const FILTER_OPTIONS: { value: ScopeFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "business", label: "Business" },
  { value: "personal", label: "Personal" },
];

export default function ScopeFilter({
  scope,
}: {
  scope: TransactionScope | null;
}) {
  const active: ScopeFilterValue = scope ?? "all";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  function navigate(next: ScopeFilterValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("scope");
    } else {
      params.set("scope", next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="join">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={`btn btn-sm join-item ${
            active === option.value ? "btn-active" : ""
          }`}
          onClick={() => navigate(option.value)}
          aria-pressed={active === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
