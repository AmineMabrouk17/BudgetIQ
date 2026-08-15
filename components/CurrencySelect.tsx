"use client";

import {
  CURRENCIES,
  setDisplayCurrency,
  useDisplayCurrency,
} from "@/lib/currency";

export default function CurrencySelect() {
  const code = useDisplayCurrency();

  return (
    <select
      className="select select-bordered select-sm w-24"
      value={code}
      onChange={(event) => setDisplayCurrency(event.target.value)}
      aria-label="Display currency"
      title="Display currency"
    >
      {CURRENCIES.map(({ code: currencyCode, name }) => (
        <option key={currencyCode} value={currencyCode}>
          {currencyCode}
        </option>
      ))}
    </select>
  );
}
