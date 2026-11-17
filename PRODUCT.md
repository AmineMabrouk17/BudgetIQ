# Product: BudgetIQ

> Durable product context for design and implementation agents. Generated from `README.md` and `CONTEXT.md` using Impeccable's recommended-answer defaults (the maintainer asked for no interactive questions).

## What this product is

BudgetIQ is a free, open-source, AI-powered personal finance app. People track income, expenses, and assets in one place, and a built-in **AI assistant** logs transactions from natural language ("I spent $45 on groceries today") after one-click confirmation. The dashboard updates immediately with net balance, monthly spending, total assets, and category breakdowns.

BudgetIQ is **not** a budgeting/limits product. It tracks money; it does not set or enforce budgets. Never use "budget planner" as a product claim in landing copy or marketing.

## Users

- **People tired of data entry** — they want to describe a transaction the way they say it out loud, not fill in rows in a spreadsheet.
- **Freelancers and people with variable income** — they need to see income, expenses, and assets together and understand the current month at a glance.
- **Privacy-conscious self-hosters** — they choose BudgetIQ because data lives in their own Supabase project behind Row-Level Security.
- **Mobile and desktop users** — the same flows must work on a phone one-handed and on a wide dashboard.

## Jobs to be done

1. Log an income, expense, or asset with the fewest possible steps.
2. Understand the current financial picture (net balance, monthly spending, total assets, savings rate) without doing arithmetic.
3. See where money goes by category, in the user's chosen **display currency** (conversion is display-only).
4. Trust that no one else can see their data.

## Brand commitments

- **Conversational, not robotic.** The assistant is an "AI assistant", never a "chatbot" or "bot".
- **Private by default.** RLS-backed storage; each user only ever sees their own rows.
- **Zero data-entry fatigue.** Natural language in, one confirmation click, done.
- **Fast and calm.** Streaming dashboard, light and dark themes, restrained motion, no ads, no upsell.
- **Honest scope.** No budget/limits claims. Display currency conversion is explicitly display-only; stored amounts stay in USD base currency.

## Vocabulary (authoritative; see CONTEXT.md)

| Use | Avoid |
|---|---|
| AI assistant | chatbot, bot |
| Income | revenue |
| Expense | spending, cost |
| Asset | valuables |
| Display currency | currency setting, active currency |
| Category | tag, label |
| Budget planner (only as "not a budgeting app") | claiming budgeting features |

## Design constraints

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, DaisyUI v5, Recharts, lucide-react.
- Light and dark DaisyUI themes with a persisted toggle; both must be legible.
- Operate mode for the dashboard and settings; Persuade mode for the landing page.
- Respect `prefers-reduced-motion` for scroll-reveal and chart animations.
- Domain terminology must match `CONTEXT.md` in all UI copy and error messages.

## Non-goals

- Budgets, limits, alerts, or forecasting beyond the existing spending-trajectory view.
- Multi-currency storage or per-transaction currency selection.
- A generic chatbot persona or marketing claims the product cannot back.
