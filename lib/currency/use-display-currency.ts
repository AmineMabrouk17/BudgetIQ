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

let ratesRequest: Promise<CurrencyRates> | null = null;

/**
 * Fetches the exchange rates once per page load, no matter how many components
 * ask for them.
 *
 * Caching only the resolved value was not enough: the summary cards, the
 * charts and the transaction table all mount in the same tick, so each called
 * `loadRates()` before the first response had landed and every one of them
 * fired its own `/api/currency-rates` request. Holding the in-flight promise
 * collapses those concurrent callers onto a single network request.
 *
 * A failed or rate-limited request resolves to `{}` and is not retried, so a
 * failing endpoint cannot turn into a retry storm on every render.
 */
export function loadRates(): Promise<CurrencyRates> {
  if (ratesRequest) return ratesRequest;

  ratesRequest = (async () => {
    try {
      const response = await fetch("/api/currency-rates", {
        cache: "no-store",
      });
      if (!response.ok) return {};
      const data: unknown = await response.json();
      return (data as { rates?: CurrencyRates } | null)?.rates ?? {};
    } catch {
      return {};
    }
  })();

  return ratesRequest;
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
