<p align="center">
  <img src="public/nobg-logo.png" alt="BudgetIQ" width="420" />
</p>

# BudgetIQ

### Your money, finally under control.

BudgetIQ is a **free, open-source, AI-powered personal finance app**. Track your income, expenses, and assets in one place — and let the built-in Gemini assistant log transactions straight from the way you talk about them. No spreadsheet drudgery, no hidden costs, no ads.

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
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/DaisyUI-v5-5A0EF8?style=for-the-badge&logo=daisyui&logoColor=white" alt="DaisyUI" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Recharts-D3-22B8CF?style=for-the-badge&logo=recharts&logoColor=white" alt="Recharts" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 📖 Overview

Keeping track of money is usually a chore: every coffee, every subscription, every freelance paycheck. BudgetIQ flips that around.

Instead of manually filling out rows of a finance app, you just **talk**. Type *"I spent $45 on groceries today"* into the assistant and BudgetIQ detects the expense, asks for confirmation, and logs it with a single click. Your dashboard — net balance, monthly spending, total assets, and category breakdowns — updates instantly.

Under the hood it pairs a **Next.js** front end with **Supabase** (PostgreSQL + Auth) for data and authentication, and the **Google Gemini API** for natural-language understanding. Everything is built on Server Actions with Row-Level Security, so your data stays yours and yours only.

### Why BudgetIQ?

- **Zero data entry fatigue** — the AI assistant does the logging for you.
- **Free & open source** — self-host it, fork it, or just use the hosted demo.
- **Private by default** — RLS-backed storage means every user only ever sees their own data.
- **Fast, modern, responsive** — a polished DaisyUI/Tailwind interface with light & dark themes.

---

## ✨ Features

### 🤖 Core Functionality
- **AI financial assistant** — a chat drawer that parses natural language, detects income / expense / asset intent, and offers a one-click confirmation card to log the transaction.
- **Transaction tracking** — log and delete **Income**, **Expenses**, and **Assets** from a single modal.
- **Financial summary cards** — at-a-glance **Net Balance**, **Monthly Spending**, and **Total Assets**.
- **Category breakdowns** — interactive Recharts visualisations of where your money goes.

### 🎨 UI / UX
- **Polished landing page** — hero with product mockup, features grid, how-it-works, testimonials, FAQ, CTA band, and footer.
- **Scroll-reveal motion** — subtle, tasteful entrance animations as sections come into view.
- **Light & dark themes** — DaisyUI theming with a persisted theme toggle.
- **Responsive everywhere** — works beautifully on desktop, tablet, and mobile.

### 🗄️ Data Handling
- **Supabase PostgreSQL** database with full **Row-Level Security** — users can only read, create, or delete their own rows.
- **Server Actions + data layer** — every operation runs as the signed-in user with strict server-side validation.
- **Auto-created profiles** — a trigger creates a profile on signup, pulling name & avatar from the auth provider.
- **Daily motivational quotes** — rotate wisdom on the dashboard to keep you motivated.

### 🔌 API Integrations
- **Supabase Auth** — Google OAuth (one-click) and email/password sign-in.
- **Google Gemini** (`gemini-3.6-flash` via the Interactions API) — structured JSON responses with schema-enforced transaction detection.
- **Session-protected endpoint** — `/api/chat` requires an authenticated session.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and `pnpm` (or `npm`)
- A [Supabase](https://supabase.com) project
- A [Google Gemini](https://aistudio.google.com) API key

### 1. Clone & install

```bash
git clone https://github.com/AmineMabrouk17/BudgetIQ.git
cd BudgetIQ
pnpm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill it in:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
GEMINI_API_KEY=your-gemini-api-key
API_NINJAS_API_KEY=your-api-ninjas-api-key
```

### 3. Set up the database

Open the **SQL Editor** in your Supabase dashboard and run the schema (see `supabase/migrations/`) to create the `transactions` and `profiles` tables, their RLS policies, and the signup trigger. `lib/env.ts` enforces the required environment variables at boot.

### 4. Configure auth

Enable the **Google** provider in Supabase → Authentication → Providers, add the Supabase callback URL in Google Cloud Console, and register `http://localhost:3000/auth/callback` in **Authentication → URL Configuration**. Email/password works out of the box. For reliable verification/reset emails in production, point Supabase SMTP at a provider such as [Resend](https://resend.com).

### 5. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

### 6. Test

```bash
pnpm test      # Vitest + Testing Library
pnpm lint      # ESLint
```

---

## ☁️ Deployment

Deploy to Vercel in minutes:

1. Push this repository to GitHub and import it into Vercel.
2. Add the environment variables from step 2 (set `NEXT_PUBLIC_SITE_URL` to your production URL).
3. Deploy.
4. Add your production callback URL (e.g. `https://your-app.vercel.app/auth/callback`) to Supabase → Authentication → URL Configuration.

---

## 🗺️ Roadmap & Suggested Issues

A non-exhaustive set of ideas for the future — feel free to open these as GitHub issues and pick them up.

| Priority | Suggestion |
| :---: | --- |
| 🔴 High | Export transactions to CSV / PDF statements |
| 🔴 High | Budgeting & spending limits per category with alerts |
| 🔴 High | Recurring transactions (subscriptions, monthly bills) |
| 🟡 Medium | Transaction editing (currently log & delete only) |
| 🟡 Medium | Date-range filtering and search on the transaction table |
| 🟡 Medium | Multi-currency support with live exchange rates |
| 🟡 Medium | Email/password reset flow powered by the Resend SMTP setup |
| 🟢 Low | Savings goals & progress tracking |
| 🟢 Low | Mobile PWA installability with offline-first caching |
| 🟢 Low | Push notifications for quote of the day |
| 🟢 Low | Data import from CSV / bank statements |
| 🟢 Low | i18n / localization (French, Arabic, …) |

---

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions) · React 19 · TypeScript |
| Styling | Tailwind CSS v4 · DaisyUI 5 · Lucide icons |
| Database & Auth | Supabase (PostgreSQL + Auth + RLS) |
| AI | Google Gemini (`gemini-3.6-flash`, Interactions API) |
| Charts | Recharts |
| Testing | Vitest · Testing Library |
| Deployment | Vercel |

---

## ⚡ Performance & Architecture Engineering

Through a two-phase performance engineering refactor, the `/dashboard` route's initial server response (TTFB) was reduced by **88.9%** (from **2,510ms down to 279ms**), bringing the full initial shell delivery into sub-second, perceived-instant speed.

```
Baseline: ████████████████████ 2,510 ms
Phase 1:  ██████ 717 ms (-71.4%)
Phase 2:  ██ 279 ms (-88.9% total)
```

### Phase 1: RSC Streaming & Datacenter Co-location
- **RSC Streaming (`<Suspense>`)**: Decomposed monolithic page data fetching into asynchronous streaming boundaries with skeleton fallbacks so the shell renders without awaiting transactions.
- **Request-Scoped Memoization (`React.cache`)**: Wrapped Supabase `getUser()` and `getProfile()` to eliminate redundant auth lookups per request.
- **In-flight Promise Deduplication**: Merged concurrent client-side calls to `/api/currency-rates` from 4 network requests down to 1.
- **Infrastructure Co-location**: Aligned Vercel serverless function execution region (`dub1` Dublin, Ireland) with the Supabase database region (`eu-west-1`), eliminating transatlantic network round-trips.

### Phase 2: Zero-Round-Trip Auth Shell
A second pass removed the last blocking calls from the dashboard shell, so a warm `/dashboard` request flushes HTML with zero database or Auth API round-trips:
- **Local JWT Verification**: `getUser()` verifies the access token's signature against the project's JWKS via `supabase.auth.getClaims()` instead of round-tripping to `/auth/v1/user`. Because the app builds a client per request, [`lib/auth/jwks.ts`](lib/auth/jwks.ts) holds the key set in module scope — one download per process rather than per request. Tokens that cannot be verified locally (expired, symmetric, tampered) fall back gracefully to the Auth API.
- **Onboarding Flag in the Token**: Completing onboarding writes `onboarded: true` to `user_metadata`, so the layout gates on the verified token instead of querying `profiles` on every load. Migration [`0009`](supabase/migrations/0009_onboarded_flag_backfill.sql) backfills the flag for existing users.
- **Pushed-Down Data Access**: The navbar's income-profile editor moved behind a `<Suspense>` boundary (`NavbarIncomeSettings`) — it is a collapsed dropdown, and reading the profile there was holding back the entire document.

> **Note on Supavisor**: Not applicable. BudgetIQ reaches the database through PostgREST over HTTPS via `supabase-js`; it never opens a direct Postgres connection, so there is no connection string to point at the transaction pooler on port 6543. Supabase manages that connection pooling behind PostgREST already.

### 📊 Benchmark Results

| Metric | Baseline (Initial) | Phase 1 (Co-location + RSC) | Phase 2 (Zero-I/O Shell) | Total Delta |
| :--- | :--- | :--- | :--- | :--- |
| **TTFB (Time to First Byte)** | `2,510 ms` | `717 ms` | **`279 ms`** | **⚡ -88.9% (9x faster)** |
| **Total Shell Duration** | `2,740 ms` | `797 ms` | **`332 ms`** | **🚀 -87.8% (Sub-second)** |
| **Currency API Requests** | `4 requests` | `1 request` | **`1 request`** | **🛑 -75%** |
| **Layout Database I/O** | 2 queries | 1 query | **0 queries** | **Zero-round-trip** |
| **Perceived UX** | White freeze (~2.5s) | Fast Skeleton (~700ms) | **Instant UI shell (<300ms)** | Instant perceived load |

> *All benchmarks verified on production deployments via Chrome DevTools Network profiler with disabled cache over international fiber connections (North Africa to Dublin, Ireland).*

---

## 📁 Project Structure

```
├── app/
│   ├── (auth)/            # Login & auth callback routes
│   ├── (dashboard)/       # Dashboard pages & layout
│   ├── actions/           # Server Actions (auth, transactions)
│   ├── api/               # /api/chat (Gemini) route
│   └── layout.tsx         # Root layout, fonts & theme
├── components/
│   ├── ai/                # AI assistant drawer & action cards
│   ├── dashboard/         # Summary cards, charts, tables, modals
│   ├── landing/           # Landing page sections (with tests)
│   └── Navbar.tsx         # Header with auth & theme toggle
├── lib/                   # Supabase clients, Gemini, data layers
├── supabase/migrations/   # Database schema & RLS
└── types/                 # Shared types
```

---

## 🤝 Contributing

Contributions are very welcome! The project is tracked on a [GitHub Project board](https://github.com/users/AmineMabrouk17/projects/4) with implementation-ready issues — see [`docs/taskflow.md`](docs/taskflow.md).

1. Fork the repo and create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

Please make sure tests and lint pass before opening your PR.

---

## 📄 License

Distributed under the **MIT License**. See the repository license file for details.

---

<p align="center">
  <strong>Built with ❤️ · BudgetIQ — Your money, finally under control.</strong>
  <br />
  <a href="https://budgetiq-two.vercel.app/">Live App</a> · <a href="https://github.com/AmineMabrouk17/BudgetIQ">GitHub</a>
</p>
