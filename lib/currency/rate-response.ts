import {
  BASE_CURRENCY,
  CURRENCY_CODES,
  type CurrencyRates,
} from "@/lib/currency";

/**
 * Free, keyless exchange-rate endpoint (exchangerate-api.com open access).
 * No API key is required, and it covers every currency in CURRENCIES,
 * including TND.
 */
export const RATES_ENDPOINT = "https://open.er-api.com/v6/latest/USD";

type RatesResponse = {
  result?: unknown;
  base_code?: unknown;
  rates?: unknown;
};

/**
 * Turns the provider payload into the rates this app supports. Anything
 * unrecognised or unusable is dropped rather than trusted, and a payload with
 * no usable non-USD rate is rejected so it never replaces cached rates.
 */
export function parseRatesResponse(data: unknown): CurrencyRates | null {
  if (typeof data !== "object" || data === null) return null;

  const payload = data as RatesResponse;
  if (payload.result !== "success") return null;
  if (payload.base_code !== BASE_CURRENCY) return null;
  if (typeof payload.rates !== "object" || payload.rates === null) return null;

  const source = payload.rates as Record<string, unknown>;
  const rates: CurrencyRates = { [BASE_CURRENCY]: 1 };

  for (const code of CURRENCY_CODES) {
    if (code === BASE_CURRENCY) continue;
    const raw = source[code];
    if (typeof raw !== "number" && typeof raw !== "string") continue;
    const rate = Number(raw);
    if (Number.isFinite(rate) && rate > 0) rates[code] = rate;
  }

  return Object.keys(rates).length > 1 ? rates : null;
}

export async function fetchRatesFromApi(): Promise<CurrencyRates> {
  const response = await fetch(RATES_ENDPOINT, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Rates API: HTTP ${response.status}`);

  const rates = parseRatesResponse(await response.json());
  if (!rates) throw new Error("Rates API: unparseable response");
  return rates;
}
