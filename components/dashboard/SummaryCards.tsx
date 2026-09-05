"use client";

import type { Summary } from "@/lib/summary";
import type { IncomeType } from "@/lib/profiles";
import { useCurrencyFormatter } from "@/lib/currency/use-display-currency";
import {
  cardsForPersona,
  DEFAULT_INCOME_TYPE,
} from "@/lib/dashboard-cards";

export default function SummaryCards({
  summary,
  hasTransactions,
  incomeType = DEFAULT_INCOME_TYPE,
}: {
  summary: Summary;
  hasTransactions: boolean;
  incomeType?: IncomeType;
}) {
  const format = useCurrencyFormatter();
  const cards = cardsForPersona(incomeType);
  return (
    <section aria-label="Financial summary">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const ctx = { summary, format };
          return (
            <div key={card.id} className="stat rounded-box bg-base-100 shadow">
              <div className={`stat-figure ${card.iconClass}`}>
                <Icon className="h-8 w-8" />
              </div>
              <div className="stat-title">{card.title}</div>
              <div className="stat-value text-2xl">{card.renderValue(ctx)}</div>
              <div className="stat-desc">{card.renderSubtitle(ctx)}</div>
            </div>
          );
        })}
      </div>
      {!hasTransactions && (
        <p className="mt-3 text-sm text-base-content/60">
          No transactions yet — add your first one and your summary will update
          live.
        </p>
      )}
    </section>
  );
}
