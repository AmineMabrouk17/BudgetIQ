"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Summary } from "@/lib/summary";
import type { IncomeType } from "@/lib/profiles";
import { useCurrencyFormatter } from "@/lib/currency/use-display-currency";
import {
  cardsForPersona,
  DEFAULT_INCOME_TYPE,
} from "@/lib/dashboard-cards";
import {
  deleteCustomKPI,
  listCustomKPIs,
} from "@/app/actions/kpis";
import type { EvaluatedKPI } from "@/lib/kpi-calculator";
import KpiModal from "@/components/dashboard/KPIModal";

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

  const [kpis, setKpis] = useState<EvaluatedKPI[] | null>(null);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EvaluatedKPI | null>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    listCustomKPIs().then((result) => {
      if (!active) return;
      if (result.ok) {
        setKpis(result.kpis);
        setKpiError(null);
      } else {
        setKpis([]);
        setKpiError(result.error);
      }
    });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function openEdit(kpi: EvaluatedKPI) {
    setEditing(kpi);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleSaved() {
    reload();
  }

  async function handleDelete(id: string) {
    const result = await deleteCustomKPI(id);
    if (!result.ok) setKpiError(result.error);
    reload();
  }

  return (
    <section aria-label="Financial summary">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-base-content">
          Financial Summary
        </h2>
      </div>

      {kpiError && <p className="mb-3 text-sm text-error">{kpiError}</p>}

      {/* Unified inline grid for persona stats and custom KPIs */}
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

        {kpis?.map(({ kpi, result }) => (
          <div key={kpi.id} className="stat rounded-box bg-base-100 shadow">
            <div className="stat-figure flex gap-1">
              <button
                className="btn btn-ghost btn-xs btn-circle"
                aria-label={`Edit ${kpi.title}`}
                onClick={() => openEdit({ kpi, result })}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                className="btn btn-ghost btn-xs btn-circle text-error"
                aria-label={`Delete ${kpi.title}`}
                onClick={() => handleDelete(kpi.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="stat-title">{kpi.title}</div>
            <div className="stat-value text-2xl">{format(result.value)}</div>
            {result.subtitle && (
              <div className="stat-desc">{result.subtitle}</div>
            )}
          </div>
        ))}
      </div>

      {!hasTransactions && (
        <p className="mt-3 text-sm text-base-content/60">
          No transactions yet — add your first one and your summary will update
          live.
        </p>
      )}

      {modalOpen && (
        <KpiModal
          open={modalOpen}
          kpi={editing}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}