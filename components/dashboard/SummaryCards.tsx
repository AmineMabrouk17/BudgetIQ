"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Summary } from "@/lib/summary";
import type { IncomeType } from "@/lib/profiles";
import { useCurrencyFormatter } from "@/lib/currency/use-display-currency";
import {
  cardsForPersona,
  DEFAULT_INCOME_TYPE,
} from "@/lib/dashboard-cards";
import { deleteCustomKPI, listCustomKPIs } from "@/app/actions/kpis";
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

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

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

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-base-content">Custom KPIs</h2>
        <button className="btn btn-outline btn-sm" onClick={openCreate}>
          <Plus />
          Add KPI
        </button>
      </div>

      {kpiError && (
        <p className="mt-3 text-sm text-error">{kpiError}</p>
      )}

      {kpis === null ? (
        <p className="mt-3 text-sm text-base-content/60">
          Loading custom KPIs…
        </p>
      ) : kpis.length === 0 ? (
        <div className="mt-3 rounded-box border border-dashed border-base-content/30 p-6 text-center text-sm text-base-content/60">
          No custom KPIs yet — add one to track a metric your way.
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map(({ kpi, result }) => (
            <div key={kpi.id} className="card rounded-box bg-base-100 shadow">
              <div className="card-body p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="stat-title">{kpi.title}</div>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-ghost btn-xs"
                      aria-label={`Edit ${kpi.title}`}
                      onClick={() => openEdit({ kpi, result })}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      aria-label={`Delete ${kpi.title}`}
                      onClick={() => handleDelete(kpi.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="stat-value text-2xl">{format(result.value)}</div>
                {result.subtitle && (
                  <div className="stat-desc">{result.subtitle}</div>
                )}
              </div>
            </div>
          ))}
        </div>
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
