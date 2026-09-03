import type { Delta } from "@/lib/summary";

const DATE_FALLBACK = "—";

function formatSign(value: number): string {
  return value > 0 ? "+" : value < 0 ? "−" : "";
}

export function formatMoneyDelta(
  delta: Delta,
  format: (amount: number) => string
): string {
  const value = `${formatSign(delta.value)}${format(Math.abs(delta.value))}`;
  if (delta.percentage === null) return value;
  const pctSign = formatSign(delta.percentage);
  return `${value} (${pctSign}${Math.abs(delta.percentage).toFixed(1)}%)`;
}

export function formatRateDelta(delta: Delta): string {
  return `${formatSign(delta.value)}${Math.abs(delta.value * 100).toFixed(1)} pp`;
}

export function formatDate(value: string, locale?: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return DATE_FALLBACK;
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
