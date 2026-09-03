export const BASE_CURRENCY = "USD";
export const DEFAULT_DISPLAY_CURRENCY = "USD";
export const CURRENCY_COOKIE = "display-currency";
export const CURRENCY_RATES_TTL_MS = 86_400_000;

export type Currency = {
  code: string;
  name: string;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "KRW", name: "South Korean Won" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "TND", name: "Tunisian Dinar" },
];

export const CURRENCY_CODES = CURRENCIES.map((currency) => currency.code);

export type CurrencyRates = Record<string, number>;

export type CurrencyRateRow = {
  currency: string;
  rate_to_usd: number;
  fetched_at: string;
};

export function convertFromUsd(
  amountUsd: number,
  code: string,
  rates: CurrencyRates
): number {
  const rate = rates[code];
  if (!Number.isFinite(rate) || rate <= 0) return amountUsd;
  return amountUsd * rate;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function formatterFor(code: string): Intl.NumberFormat {
  let formatter = formatterCache.get(code);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    });
    formatterCache.set(code, formatter);
  }
  return formatter;
}

export function formatCurrency(
  amountUsd: number,
  code: string,
  rates: CurrencyRates
): string {
  const safeCode = CURRENCY_CODES.includes(code) ? code : BASE_CURRENCY;
  return formatterFor(safeCode).format(convertFromUsd(amountUsd, safeCode, rates));
}

export function isRateStale(
  fetchedAt: string | Date,
  now: Date = new Date(),
  ttlMs: number = CURRENCY_RATES_TTL_MS
): boolean {
  const fetched = typeof fetchedAt === "string" ? new Date(fetchedAt) : fetchedAt;
  if (Number.isNaN(fetched.getTime())) return true;
  return now.getTime() - fetched.getTime() > ttlMs;
}

export function needsRateRefresh(
  rows: CurrencyRateRow[],
  wanted: string[] = CURRENCY_CODES,
  now: Date = new Date(),
  ttlMs: number = CURRENCY_RATES_TTL_MS
): boolean {
  const freshCodes = new Set(
    rows
      .filter((row) => !isRateStale(row.fetched_at, now, ttlMs))
      .map((row) => row.currency)
  );
  return wanted.some((code) => !freshCodes.has(code));
}

export function ratesFromRows(rows: CurrencyRateRow[]): CurrencyRates {
  const rates: CurrencyRates = {};
  for (const row of rows) {
    if (Number.isFinite(row.rate_to_usd) && row.rate_to_usd > 0) {
      rates[row.currency] = row.rate_to_usd;
    }
  }
  return rates;
}

export function pickRates(
  stored: CurrencyRates,
  fetched: CurrencyRates | null
): CurrencyRates {
  if (fetched && Object.keys(fetched).length > 0) return fetched;
  return stored;
}

const listeners = new Set<() => void>();

export function storedDisplayCurrency(): string {
  if (typeof document === "undefined") return DEFAULT_DISPLAY_CURRENCY;
  const match = document.cookie.match(/(?:^|;\s*)display-currency=([A-Za-z]{3})/);
  if (match && CURRENCY_CODES.includes(match[1].toUpperCase())) {
    return match[1].toUpperCase();
  }
  return DEFAULT_DISPLAY_CURRENCY;
}

export function subscribeToDisplayCurrency(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getDisplayCurrencySnapshot(): string {
  return storedDisplayCurrency();
}

export function setDisplayCurrency(code: string): void {
  const safeCode = CURRENCY_CODES.includes(code)
    ? code
    : DEFAULT_DISPLAY_CURRENCY;
  document.cookie = `${CURRENCY_COOKIE}=${safeCode}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((listener) => listener());
}
