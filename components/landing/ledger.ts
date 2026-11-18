/** One ledger vocabulary for both the live ticker and the statement mockup. */
export type LedgerTone = "in" | "out" | "neutral";

export interface LedgerEntry {
  category: string;
  amount: string;
  tone: LedgerTone;
  /** Only the statement mockup shows a date or account count. */
  meta?: string;
}

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
