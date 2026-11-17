# Design plan: Impeccable P1 findings

Source: `.impeccable/critique/2026-11-17T15-57-01Z__app-components.md`
Owner spec: GitHub issue #152

## A1 — Keyboard-accessible sortable headers

- **severity:** P1
- **files:** `components/dashboard/TransactionTable.tsx`
- **problem:** Sortable `<th onClick>` elements are not focusable and expose no `aria-sort`.
- **acceptance_criteria:**
  - Each sortable header contains a `<button type="button">` reachable by Tab and activatable by Enter/Space.
  - Each sortable `<th>` has `aria-sort` of `ascending`, `descending`, or `none`, updated on sort change.
  - Visible arrow matches `aria-sort`.
  - No sort relies solely on `<th onClick>`.

## A2 — Honest, labelled scope filter

- **severity:** P1
- **files:** `app/(dashboard)/dashboard/page.tsx`, `components/dashboard/ScopeFilter.tsx`, `components/dashboard/TransactionTable.tsx`
- **problem:** Bare button group has no accessible name and is placed between summary and analytics though it only filters transactions.
- **acceptance_criteria:**
  - `role="group"` with `aria-label="Transaction scope"`.
  - Control moved into the Transactions card header and copy states it affects transactions only.
  - `aria-pressed` stays accurate; selection changes only transactions.
  - No standalone filter row remains between summary and analytics.

## A3 — Save feedback and fresh table rows

- **severity:** P1
- **files:** `components/dashboard/AddTransactionModal.tsx`, `components/dashboard/TransactionTable.tsx`, `app/(dashboard)/dashboard/page.tsx`, `components/dashboard/DashboardTransactions.tsx`
- **problem:** Successful save is silent; table state never reconciles with revalidated server props.
- **acceptance_criteria:**
  - `role="status"` confirmation visible and announced after save.
  - Confirmation persists long enough to read; failure keeps inline error and shows no success.
  - New transaction appears in the table after save without manual reload.

## A4 — Reachable Add KPI

- **severity:** P1
- **files:** `components/dashboard/SummaryCards.tsx`
- **problem:** Landing advertises custom KPI cards and `KPIModal` implements creation, but no UI opens the create branch.
- **acceptance_criteria:**
  - Visible "Add KPI" control in Financial Summary header.
  - Opens `KpiModal` with `kpi === null` (Add KPI title, empty defaults).
  - Saving closes the modal and the new card appears via the existing reload path.
  - Control is keyboard focusable with a visible focus indicator.
