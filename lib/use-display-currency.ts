"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import {
  DEFAULT_DISPLAY_CURRENCY,
  formatCurrency,
  getDisplayCurrencySnapshot,
  subscribeToDisplayCurrency,
  type CurrencyRates,
} from "@/lib/currency";

export function useDisplayCurrency(): string {
  return useSyncExternalStore(
    subscribeToDisplayCurrency,
    getDisplayCurrencySnapshot,
    () => DEFAULT_DISPLAY_CURRENCY
  );
}

let cachedRates: CurrencyRates | null = null;

async function loadRates(): Promise<CurrencyRates> {
  if (cachedRates) return cachedRates;
  try {
    const response = await fetch("/api/currency-rates", {
      cache: "no-store",
    });
    if (!response.ok) return {};
    const data: unknown = await response.json();
    const rates = (data as { rates?: CurrencyRates } | null)?.rates ?? {};
    cachedRates = rates;
    return rates;
  } catch {
    return {};
  }
}

export function useCurrencyFormatter(): (amountUsd: number) => string {
  const code = useDisplayCurrency();
  const [rates, setRates] = useState<CurrencyRates | null>(null);

  useEffect(() => {
    let active = true;
    loadRates().then((loaded) => {
      if (active) setRates(loaded);
    });
    return () => {
      active = false;
    };
  }, [code]);

  return useMemo(
    () => (amountUsd: number) => formatCurrency(amountUsd, code, rates ?? {}),
    [code, rates]
  );
}
