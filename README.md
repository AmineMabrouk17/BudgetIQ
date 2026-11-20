<p align="center">
  <img src="public/nobg-logo.png" alt="BudgetIQ" width="420" />
</p>

# BudgetIQ

### Your money, finally under control.

BudgetIQ is a personal finance app you can host yourself. You track your **income**, **expenses** and **assets** in one place — or just type a sentence like *"I spent $45 on groceries today"* and let the built-in **AI assistant** record it for you after one confirmation click.

The dashboard then shows where you stand: net balance, income, spending, savings rate, charts, and any extra metrics you build yourself. A separate **Salary Planner** helps you plan a monthly salary across four pillars with AI guidance.

The source code is public on GitHub, there is a free hosted demo, there are no ads, and all your data lives in your own Supabase project.

<p align="center">
  <a href="https://budgetiq-two.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live_Demo-Visit_Now-1e3a5f?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://github.com/AmineMabrouk17/BudgetIQ" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-Source_Code-181717?style=for-the-badge&logo=github&logoColor=white" alt="Source Code" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/DaisyUI-5-5A0EF8?style=for-the-badge&logo=daisyui&logoColor=white" alt="DaisyUI" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini_+_OpenRouter-AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="AI providers" />
  <img src="https://img.shields.io/badge/Recharts-Charts-22B8CF?style=for-the-badge&logo=recharts&logoColor=white" alt="Recharts" />
</p>

---

## Table of contents

- [What you can do with it](#what-you-can-do-with-it)
- [What it is *not*](#what-it-is-not)
- [How the app fits together](#how-the-app-fits-together)
- [Run it on your own machine](#run-it-on-your-own-machine)
- [Your first five minutes in the app](#your-first-five-minutes-in-the-app)
- [Commands you will use](#commands-you-will-use)
- [A closer look at the main features](#a-closer-look-at-the-main-features)
- [Project structure](#project-structure)
- [Deploy to Vercel](#deploy-to-vercel)
- [Contributing](#contributing)
- [More documentation](#more-documentation)
- [License](#license)

---

## What you can do with it

### Track money without filling in spreadsheets

- **Talk to the AI assistant.** Open the chat drawer and write what happened. It figures out whether it was income, an expense, or an asset, suggests a title, amount and category, and you confirm with one click.
- **Or add it manually.** The "Add transaction" dialog lets you pick a type (Income / Expense / Asset), a title, an amount, a category and a scope.
- **Keep work and life apart.** Every transaction is either **Personal** or **Business**, and the dashboard can be filtered to one or the other with `?scope=personal` or `?scope=business`.
- **Delete mistakes.** Transactions can be removed from the table. (Editing an existing transaction is not built yet.)

### See the big picture

- **Summary cards** for Net Balance, Income, Spending and Savings Rate, each with a month-over-month comparison where it makes sense. Assets count toward Net Balance.
- **Three chart tabs**: Cash Flow, Spending Trajectory, and Category Breakdown (donut or ranked list).
- **Custom KPI cards.** Add your own metrics, for example "restaurant spending this month" or "75% of monthly expenses", and edit or delete them at any time.

### Plan a salary

The **Salary Planner** is a separate page where you enter your monthly salary, whether you support dependents, and what you currently spend in four areas. The app shows targets and progress for the "four pillars":

| Pillar | Built-in guideline |
| --- | --- |
| Essentials | at most 60% of salary |
| Lifestyle / wants | at most 20% of salary |
| Emergency fund | 3–6 months of essentials, or 12 months with dependents |
| Investments | roughly 10–20%+ of salary |

You can also chat with an AI financial strategist. It answers in your language, turns things you mention ("rent 450, internet 110, gym 60") into bucket totals, and saves the conversation and plan for next time.

### Use your own currency

Pick a **display currency** from 16 options in the header. Every money figure on the dashboard is converted for display. Amounts are always *stored* in USD and converted only when shown, so changing currency never rewrites your data. (See the [decision record](docs/adr/0001-display-only-currency.md).)

### Stay private and protected

- Supabase **Row-Level Security** means one account can only read and change its own rows.
- Google sign-in and email/password sign-in, with Cloudflare Turnstile bot protection on the login form.
- Rate limits on chat, salary planning and login attempts.
- A password-protected **Admin** page lists registered accounts (visible only after unlocking it with the admin password).

---

## What it is *not*

These boundaries are deliberate, so nobody expects something the code does not do:

- **Not a budgeting/limits app.** The Salary Planner gives guidance and the custom KPI "budget remaining" operation can show a number, but BudgetIQ does not set, enforce or alert on budgets.
- **Not a multi-currency ledger.** There is no per-transaction currency. Currency selection changes how numbers are *displayed*, not what is stored.
- **Not a generic chatbot.** The assistant is for logging money and answering finance questions; it is not a general-purpose bot.
- **No transaction editing yet.** You can add and delete transactions, but not change an existing one.

---

## How the app fits together

If you are new to the project, this is the whole system in one picture:

```
You (browser)
      │
      ▼
Next.js app  ──────► Supabase
  · landing page       · Auth (Google + email/password)
  · dashboard          · PostgreSQL tables, protected by RLS
  · salary planner
  · admin page         ──────► Gemini  ──(backup)──► OpenRouter
  · API routes          AI answers for both assistants
      │
      └──────────────► API Ninjas   exchange rates (cached in Supabase)
```

| What you see | Where it lives | What it does |
| --- | --- | --- |
| `/` | `app/page.tsx` | Public landing page. Signed-in users are sent to `/dashboard`. |
| `/login`, `/auth/callback` | `app/(auth)/`, `app/auth/callback/` | Sign in / sign up and finish Google OAuth. |
| `/dashboard` | `app/(dashboard)/dashboard/` | Summary cards, charts, transaction table, AI chat drawer. |
| `/salary-planner` | `app/(dashboard)/salary-planner/` | Four-pillar planner and AI strategist chat. |
| `/admin` | `app/(dashboard)/admin/` | Password-locked user overview. |
| `/api/chat` | `app/api/chat/route.ts` | AI assistant for logging transactions. |
| `/api/salary-planner/chat` | `app/api/salary-planner/chat/route.ts` | AI strategist for the planner. |
| `/api/currency-rates` | `app/api/currency-rates/route.ts` | Exchange rates for the display currency. |

Data is written through **Server Actions** in `app/actions/` (transactions, KPIs, salary plan, admin, auth) and read through small data-layer modules in `lib/`.

---

## Run it on your own machine

### 1. What you need

- **Node.js 20.9 or newer** (Next.js 16 requires it) and **pnpm**.
- A free or paid **[Supabase](https://supabase.com)** project.
- At least one AI key: **[Gemini](https://aistudio.google.com)** (preferred) or **[OpenRouter](https://openrouter.ai)** as a fallback. The app refuses to call the AI if neither is set, but the rest of the app still works.
- Optional: an [API Ninjas](https://api-ninjas.com) key for live exchange rates, [Cloudflare Turnstile](https://dash.cloudflare.com) keys for bot protection, and [Upstash Redis](https://upstash.com) for shared rate limits.

### 2. Install

```bash
git clone https://github.com/AmineMabrouk17/BudgetIQ.git
cd BudgetIQ
pnpm install
```

### 3. Set up environment variables

Copy the example file and fill in what you need:

```bash
cp .env.local.example .env.local
```

Only the two Supabase values are checked at startup; the others enable specific features and degrade gracefully when absent.

| Variable | Needed for | Required? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Connecting to your database and Auth | **Yes** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public (anon) Supabase key; `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works | **Yes** |
| `NEXT_PUBLIC_SITE_URL` | Links, metadata and OAuth redirects | Yes in production |
| `GEMINI_API_KEY` | Primary AI provider | One of this or OpenRouter |
| `GEMINI_MODEL` | Override the model (default `gemini-3.6-flash`) | No |
| `OPENROUTER_API_KEY` | AI backup when Gemini is out of quota | No |
| `OPENROUTER_FALLBACK_MODEL` | Override backup model (default `nvidia/nemotron-3-ultra-550b-a55b:free`) | No |
| `API_NINJAS_API_KEY` | Live exchange rates for the currency dropdown | No |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Login bot protection. Optional in development, required in production builds | Prod: yes |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared rate limits across server instances. Without them, limits are kept in memory | No |
| `ADMIN_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY` | Unlocking `/admin` and listing all users | Only for `/admin` |
| `ALLOWED_DEV_ORIGINS` | Extra localhost-like origins for `next dev` | No |
| `PREVIEW_TEST_SECRET` | Signed demo user for Vercel preview captures | No |

The service-role key bypasses Row-Level Security. Keep it server-side only and never prefix it with `NEXT_PUBLIC_`.

### 4. Create the database tables

Open your Supabase project → **SQL Editor** and run [`supabase/apply-all.sql`](supabase/apply-all.sql) once. It is safe to re-run. It creates:

| Table | Holds |
| --- | --- |
| `transactions` | Income, expenses and assets (plus personal/business scope) |
| `profiles` | One profile per user, created automatically on sign-up |
| `custom_kpis` | User-defined summary cards |
| `salary_budget_plans` | Salary, four-pillar actuals, AI advice and chat history |
| `currency_rates` | Cached exchange rates (public reference data, no RLS) |

The numbered files in `supabase/migrations/` are the same changes in order, if you prefer applying them one at a time.

### 5. Configure sign-in

- In Supabase → **Authentication → Providers**, enable **Google** and fill in your OAuth client ID/secret from Google Cloud.
- Add `http://localhost:3000/auth/callback` to **Authentication → URL Configuration** (and your production URL when you deploy).
- Email/password works out of the box. For production verification and password-reset emails, configure Supabase SMTP, for example with [Resend](https://resend.com).

### 6. Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). If you set up Supabase correctly, you can create an account and start tracking.

---

## Your first five minutes in the app

1. **Sign up** at `/login` (or continue with Google).
2. **Add a transaction** with the button at the top of `/dashboard`. Pick "Expense", type "Coffee", enter `4.50`, choose a category and save.
3. **Try the assistant.** Open the chat drawer from the dashboard and write "I earned 800 dollars from a freelance project today". Confirm the suggestion it offers.
4. **Look at the charts** and switch between Cash Flow, Spending Trajectory and Category Breakdown.
5. **Add a KPI** with "Add KPI" in the Financial Summary section — for example, total expenses this month.
6. **Open the Salary Planner** from the sidebar or header, enter a monthly salary and ask the advisor: "Here is everything I pay: rent 600, groceries 250, gym 40".

---

## Commands you will use

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the production bundle |
| `pnpm start` | Serve a production build locally |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Check TypeScript types |
| `pnpm test` | Run unit and component tests (Vitest) |
| `pnpm test:e2e` | Run browser tests (Playwright) |
| `pnpm audit` / `pnpm audit:fix` | Check / fix dependency vulnerabilities |

---

## A closer look at the main features

### The AI assistant

`You type → /api/chat → Gemini (or OpenRouter) → JSON suggestion → confirmation card → Server Action → Supabase → dashboard refresh.`

- Gemini uses the Interactions API with a strict JSON schema; OpenRouter is tried automatically if Gemini has no key, is saturated, or is out of quota. Transient overloads get retried with backoff; daily caps move on immediately.
- Messages are capped at 1,000 characters, and each user gets 20 assistant requests per minute (25 per minute for the Salary Planner advisor). With Upstash configured, limits are shared across instances; otherwise each server keeps its own counter.
- If both providers fail, the app shows a friendly error instead of breaking the page.

### The Salary Planner

The plan is stored per user in `salary_budget_plans` and includes the conversation history, so you can close the tab and come back. Targets are computed locally in `lib/salary-planner.ts`; the AI only suggests figures, which are validated before being saved. A full breakdown ("here is everything I pay") replaces the stored actuals; an incremental remark ("plus 50 for coffee") adds to them.

### Display currency

Amounts are plain USD numbers in the database and have no currency column. The header dropdown stores your choice in a cookie, and rates are fetched from API Ninjas, cached in Supabase for about 24 hours, and reused if the API is down. When you enter an amount in a non-USD currency, the app converts it back to USD before saving. See [ADR-0001](docs/adr/0001-display-only-currency.md).

### Custom KPIs

A KPI is a small formula: **source** (income, expense, balance or category) + **scope** (all / personal / business) + **timeframe** (this month, last month, last 30 days, year to date, all time) + **operation** (sum, percentage or budget remaining). Cards are created, edited and deleted through Server Actions in `app/actions/kpis.ts`.

### Admin area

`/admin` first asks for `ADMIN_PASSWORD` and sets a session cookie. Once unlocked, it uses the Supabase service-role key to list all profiles — something normal users' RLS policies do not allow. Regular users never see the Admin navigation item.

### Preview captures

On Vercel preview deployments only (`VERCEL_ENV=preview`), a signed header plus `PREVIEW_TEST_SECRET` can unlock a synthetic demo user with fixture data. It is inert in production and is what generates the UI evidence attached to pull requests.

### Why the dashboard feels fast

The dashboard shell is flushed before transaction queries finish: each section renders inside its own `<Suspense>` boundary with a skeleton. Authentication uses a request-scoped cache and local JWT signature verification (with a fallback to the Auth API), session lookups are shared across loaders, concurrent exchange-rate requests collapse into one, and the Supabase client talks to PostgREST over HTTPS so there is no direct Postgres connection to pool.

A previous performance pass recorded a drop in `/dashboard` time-to-first-byte from ~2,510 ms to ~279 ms (initial → RSC streaming + region co-location → zero-I/O shell). Treat those numbers as a historical measurement, not a guarantee — your own hosting and data volume will differ.

---

## Project structure

```
app/
  (auth)/                 Login page and OAuth callback
  (dashboard)/
    dashboard/            Dashboard page, server sections, skeletons
    salary-planner/       Salary Planner page
    admin/                Password-locked admin page
    layout.tsx            Auth guard, navbar and sidebar
  actions/                Server Actions: auth, transactions, KPIs, salary plan, admin
  api/
    chat/                 AI assistant endpoint
    salary-planner/chat/  AI strategist endpoint
    currency-rates/       Exchange-rate endpoint
  auth/callback/          OAuth code exchange
components/
  ai/                     Chat drawer, message bubbles, transaction confirmation card
  dashboard/              Summary cards, KPI modal, charts, transaction table, modals
  landing/                Public landing page sections
  salary-planner/         Planner UI
  admin/                  Admin lock and users table
  ui/                     Shared category picker
lib/
  supabase/               Browser, server and admin clients
  auth/                   Session, JWKS cache, admin session, preview bypass
  llm/                    Provider router, Gemini and OpenRouter implementations
  currency/               Conversion, formatting and rate cache
  ...                     Analytics, summaries, categories, rate limiting, data loaders
supabase/
  apply-all.sql           All migrations concatenated, safe to re-run
  migrations/             Numbered schema changes (0001–0009)
types/                    Shared TypeScript types
docs/adr/                 Architecture decision records
docs/agents/              Contributor guides (issues, labels, evidence, domain)
e2e/                      Playwright browser tests
.factory/evidence.json    UI states captured for pull requests
```

---

## Deploy to Vercel

1. Push the repository to GitHub and import it into Vercel.
2. Add the environment variables from step 3 above. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
3. Register `https://your-app.vercel.app/auth/callback` in Supabase → Authentication → URL Configuration, and use the same URL as your Google OAuth redirect.
4. Configure production email delivery in Supabase, and set the Turnstile keys (production builds require them).
5. If you use Upstash, add its Redis credentials so rate limits work across serverless instances.
6. Deploy, then open the live URL and sign in to confirm the callback works.

If your Supabase database is in `eu-west-1`, co-locating the Vercel functions in a nearby region (for example Dublin, `dub1`) avoids a transatlantic round-trip. This is a hosting setting, not something in this repository.

---

## Contributing

Contributions are welcome.

1. Fork the repository and create a feature branch (`git checkout -b feature/AmazingFeature`).
2. Make your change, following the vocabulary in [`CONTEXT.md`](CONTEXT.md) (for example: "AI assistant", not "chatbot"; "Income", not "revenue").
3. Run `pnpm lint`, `pnpm typecheck` and `pnpm test` before opening a pull request.
4. If you change the UI, add the states you changed to [`.factory/evidence.json`](.factory/evidence.json) and capture them with `scripts/capture-evidence.mjs` — see [the evidence guide](docs/agents/evidence.md).
5. Open a pull request describing what changed and why.

---

## More documentation

- [`CONTEXT.md`](CONTEXT.md) — the words the project uses and the ones it avoids.
- [`PRODUCT.md`](PRODUCT.md) — who the app is for and what it promises.
- [`docs/adr/0001-display-only-currency.md`](docs/adr/0001-display-only-currency.md) — why currency conversion is display-only.
- [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md) — how issues are tracked.
- [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md) — the five canonical labels.
- [`docs/agents/evidence.md`](docs/agents/evidence.md) — the visual evidence required for UI changes.

---

## License

There is no `LICENSE` file in the repository yet, so no license is formally granted. The code is public on GitHub; please check with the maintainer before reusing it.

---

<p align="center">
  <strong>BudgetIQ — Your money, finally under control.</strong>
  <br />
  <a href="https://budgetiq-two.vercel.app/">Live App</a> · <a href="https://github.com/AmineMabrouk17/BudgetIQ">GitHub</a>
</p>
