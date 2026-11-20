import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CURRENCY_CODES,
  needsRateRefresh,
  pickRates,
  ratesFromRows,
} from "@/lib/currency";
import type { CurrencyRates, CurrencyRateRow } from "@/lib/currency";
import { fetchRatesFromApi } from "@/lib/currency/rate-response";

async function readStoredRates(): Promise<CurrencyRateRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("currency_rates")
    .select("currency, rate_to_usd, fetched_at")
    .in("currency", CURRENCY_CODES);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    currency: row.currency,
    rate_to_usd: Number(row.rate_to_usd),
    fetched_at: row.fetched_at,
  }));
}

async function upsertStoredRates(rates: CurrencyRates): Promise<void> {
  // Persist via the service role so cache refresh works even when the
  // currency_rates table is read-only to anon/authenticated clients.
  const supabase = createAdminClient();
  const rows = Object.entries(rates).map(([currency, rate_to_usd]) => ({
    currency,
    rate_to_usd,
    fetched_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("currency_rates")
    .upsert(rows, { onConflict: "currency" });
  if (error) throw error;
}

export async function getRatesForDisplay(): Promise<CurrencyRates> {
  let storedRows: CurrencyRateRow[] = [];
  try {
    storedRows = await readStoredRates();
  } catch {
    storedRows = [];
  }

  const stored = ratesFromRows(storedRows);
  if (!needsRateRefresh(storedRows)) {
    return stored;
  }

  try {
    const fresh = await fetchRatesFromApi();
    void upsertStoredRates(fresh).catch(() => {
      // Best-effort persistence; serve the fresh rates regardless.
    });
    return pickRates(stored, fresh);
  } catch {
    return pickRates(stored, null);
  }
}
