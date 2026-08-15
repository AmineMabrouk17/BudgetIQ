import { createClient } from "@/lib/supabase/server";
import {
  BASE_CURRENCY,
  CURRENCY_CODES,
  needsRateRefresh,
  pickRates,
  ratesFromRows,
} from "@/lib/currency";
import type { CurrencyRates, CurrencyRateRow } from "@/lib/currency";

const NINJA_RATES_URL = "https://api.api-ninjas.com/v1/convertcurrency";

type NinjaRateResponse = {
  old_amount?: unknown;
  new_amount?: unknown;
};

function parseNinjaRate(data: unknown): number | null {
  if (typeof data !== "object" || data === null) return null;
  const record = data as NinjaRateResponse;
  const newAmount = Number(record.new_amount);
  const oldAmount = Number(record.old_amount);
  if (
    !Number.isFinite(newAmount) ||
    !Number.isFinite(oldAmount) ||
    oldAmount <= 0
  ) {
    return null;
  }
  return newAmount / oldAmount;
}

async function fetchNinjaRate(code: string): Promise<number> {
  const url = `${NINJA_RATES_URL}?have=${BASE_CURRENCY}&want=${code}&amount=1`;
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.API_NINJAS_API_KEY ?? "",
    },
  });
  if (!response.ok) {
    throw new Error(`Rates API ${code}: HTTP ${response.status}`);
  }
  const rate = parseNinjaRate(await response.json());
  if (rate === null) {
    throw new Error(`Rates API ${code}: unparseable response`);
  }
  return rate;
}

async function fetchRatesFromNinja(): Promise<CurrencyRates> {
  const results = await Promise.allSettled(
    CURRENCY_CODES.filter((code) => code !== BASE_CURRENCY).map(async (code) => ({
      code,
      rate: await fetchNinjaRate(code),
    }))
  );
  const rates: CurrencyRates = { [BASE_CURRENCY]: 1 };
  for (const result of results) {
    if (result.status === "fulfilled") {
      rates[result.value.code] = result.value.rate;
    }
  }
  if (Object.keys(rates).length <= 1) {
    throw new Error("No exchange rates fetched");
  }
  return rates;
}

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
  const supabase = await createClient();
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
    const fresh = await fetchRatesFromNinja();
    void upsertStoredRates(fresh).catch(() => {
      // Best-effort persistence; serve the fresh rates regardless.
    });
    return pickRates(stored, fresh);
  } catch {
    return pickRates(stored, null);
  }
}
