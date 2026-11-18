/** One ledger vocabulary for both the live ticker and the statement mockup. */
export type LedgerTone = "in" | "out" | "neutral";

export interface LedgerEntry {
  category: string;
  amount: string;
  tone: LedgerTone;
  /** Only the statement mockup shows a date or account count. */
  meta?: string;
}

/** One set of illustrative entries feeds both surfaces, so their numbers can
 *  never drift apart. */
export const ledgerSamples: LedgerEntry[] = [
  { category: "Salary", amount: "+$3,200.00", tone: "in", meta: "Aug 01" },
  { category: "Groceries", amount: "−$86.40", tone: "out", meta: "Aug 14" },
  { category: "Coffee", amount: "−$4.20", tone: "out", meta: "Aug 15" },
  { category: "Freelance", amount: "+$450.00", tone: "in", meta: "Aug 18" },
  { category: "Subscriptions", amount: "−$38.90", tone: "out", meta: "Aug 02" },
  { category: "Utilities", amount: "−$120.00", tone: "out", meta: "Aug 05" },
  {
    category: "Assets",
    amount: "$86,200.00",
    tone: "neutral",
    meta: "4 accounts",
  },
];

/** Money on the page's light surfaces. */
export const ledgerToneClass: Record<LedgerTone, string> = {
  in: "text-positive",
  out: "text-negative",
  neutral: "text-ink",
};

/** Money on the statement's dark sheet, where the page tones are too dark. */
export const sheetToneClass: Record<LedgerTone, string> = {
  in: "text-sheet-positive",
  out: "text-sheet-negative",
  neutral: "text-sheet-ink",
};
