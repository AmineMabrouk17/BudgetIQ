# 🤖 BudgetIQ - AI-Powered Personal Finance & Budget Planner

BudgetIQ is an open-source, intelligent personal finance manager. It features Google sign-in & email authentication, interactive financial tracking (Salary, Expenses, Assets), daily motivational quotes, and a built-in AI chatbot powered by the Google Gemini Free API that can naturally parse user conversation and automatically suggest adding transactions directly to your dashboard.

> 🗂️ See [`docs/taskflow.md`](docs/taskflow.md) for the project task flow (GitHub Project board + 14 implementation-ready issues).

## 🌟 Features

- 🔐 **Authentication**: One-click sign-in with Google (OAuth) or email & password, both via Supabase Auth.
- 📊 **Comprehensive Dashboard**:
  - Track Salary / Income, Expenses, and Assets.
  - Real-time financial summary cards (Net Balance, Monthly Spending, Total Assets).
  - Interactive category breakdowns and charts.
- 🤖 **Smart Gemini AI Chatbot**:
  - Chat with your financial assistant in natural language.
  - Smart Parsing: Detects spending/income in conversation (e.g., "I spent $15 on coffee") and prompts you with a button to instantly save it to your database.
- 💡 **Daily Financial Quotes**: Rotational wisdom to keep you motivated on your wealth-building journey.
- 🎨 **Modern UI with DaisyUI & Tailwind**: Built using DaisyUI themes, dark/light mode toggle, responsive layouts, and modern components.
- ⚡ **Lightning Fast & Free**: Hosted on Vercel with Supabase PostgreSQL backend.

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router, Server Actions)
- **Styling & UI Components**: Tailwind CSS + DaisyUI
- **Database & Authentication**: Supabase (PostgreSQL & Supabase Auth)
- **AI Engine**: Google Gemini API (gemini-3.6-flash via the Interactions API)
- **Deployment**: Vercel
- **Icons**: Lucide React

## 📁 Project Structure

```
├── app/
│   ├── (auth)/             # Login & Authentication Callback routes
│   ├── (dashboard)/        # Dashboard & Financial Management pages
│   ├── api/
│   │   ├── chat/           # Gemini AI API Route
│   │   └── quotes/         # Daily Quotes API Route
│   ├── globals.css         # Tailwind & DaisyUI imports
│   ├── layout.tsx          # Root Layout
│   └── page.tsx            # Landing Page
├── components/
│   ├── ai/                 # AI Chatbot drawer & message components
│   ├── dashboard/          # Summary cards, charts, transaction tables
│   ├── ui/                 # DaisyUI reusable components (Buttons, Modals)
│   └── Navbar.tsx          # Main Header with auth status & DaisyUI Theme Toggle
├── lib/
│   ├── supabase/           # Supabase client/server configurations
│   └── gemini.ts           # Gemini Interactions API client & prompts
└── public/                 # Static assets & favicon
```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js (v18.0 or higher)
- npm or pnpm
- A Supabase Account (supabase.com)
- A Google Gemini API Key (aistudio.google.com)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/budgetiq.git
cd budgetiq
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

Make sure DaisyUI is included in your dependencies:

```bash
npm install daisyui@latest @supabase/supabase-js @supabase/ssr lucide-react
```

### 3. Setup Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Next.js Public Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key

# API Ninjas (daily quotes)
API_NINJAS_API_KEY=your-api-ninjas-key
```

### 4. Database Setup (Supabase SQL)

Go to your Supabase Dashboard ➔ SQL Editor and run the following script to create your transactions table:

```sql
-- Create Transactions Table
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense', 'asset')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create Policy: Users can only see & modify their own data
CREATE POLICY "Users can manage their own transactions"
ON public.transactions
FOR ALL
USING (auth.uid() = user_id);
```

> User profiles are handled by `supabase/migrations/0002_profiles.sql` — run it from the SQL Editor to create the `profiles` table, its RLS policies, and a trigger that auto-creates a profile on signup (name & avatar are pulled from the Google provider, or from the signup form for email accounts).

### Transaction Data Layer

Transactions are managed through Server Actions in `app/actions/transactions.ts`, backed by the data layer in `lib/transactions.ts`. Shared types live in `types/transaction.ts`. Every operation runs as the signed-in user; RLS on the `transactions` table is the final backstop, so a user can only ever read, create, or delete their own rows.

```ts
// Create a transaction (income | expense | asset). Returns
// { ok: true, transaction } or { ok: false, error }.
await createTransaction({ type: "expense", title: "Coffee", amount: 5 });

// Optional: pass a client-generated UUID as `id` so retrying the action
// (e.g. a double-click) does not insert a duplicate row.

// Delete one of the caller's transactions. Returns
// { ok: true } or { ok: false, error } (error if not found or not owned).
await deleteTransaction(transactionId);

// Server-side validation rejects invalid types, empty titles,
// non-positive or non-numeric amounts, and out-of-range categories.
```

### 5. Configure OAuth Providers in Supabase

1. Navigate to Supabase Dashboard ➔ Authentication ➔ Providers.
2. **Google Setup**: Enable Google and paste your Client ID & Client Secret from Google Cloud Console.
3. Add Callback URL in Google:
   `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
4. Navigate to Authentication ➔ URL Configuration and add `http://localhost:3000/auth/callback` to **Redirect URLs** so Supabase can send users back to the app after sign-in.

Email & password sign-in is built into Supabase Auth — just make sure the **Email** provider is enabled (default). Email confirmations can be toggled under Authentication ➔ Providers ➔ Email in the **Confirm email** setting.

### 6. Configure Email (SMTP with Resend)

Supabase's default email service only sends ~2 emails/hour, so verification and password-reset emails won't reliably arrive. Use [Resend](https://resend.com) as the SMTP provider for both dev and production:

1. Create a free account at resend.com and verify a domain you own (Settings ➔ Domains). Without a domain, you can test by sending from `onboarding@resend.dev`.
2. Grab your SMTP credentials: resend.com ➔ Settings ➔ SMTP:
   - **Host:** `smtp.resend.com`
   - **Port:** `587` (or `465` for SSL)
   - **Username:** `resend`
   - **Password:** your Resend API key (`re_...`)
3. In Supabase ➔ Authentication ➔ SMTP, paste the host/port/user/password, set a **Sender email** (e.g. `onboarding@resend.dev` for testing, or `no-reply@yourdomain.com`), and save.
4. Optional: to sign up instantly without an email, turn off **Confirm email** under Authentication ➔ Providers ➔ Email. Turn it back on once SMTP is configured for production.

> Store the Resend API key only in the Supabase dashboard — never commit it to the repository.

### 7. Run Locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## 🎨 DaisyUI Theme Configuration (tailwind.config.ts)

To support DaisyUI components and themes, update your `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark", "cupcake", "emerald", "corporate", "synthwave"], // Choose your favorite DaisyUI themes
    darkTheme: "dark",
  },
};

export default config;
```

## 🤖 How the Gemini AI Assistant Integration Works

The chatbot uses Gemini's `gemini-3.6-flash` model via the Interactions API. A JSON schema (enforced with `response_format`) plus a system prompt make Gemini respond with structured JSON whenever an expense, income, or asset action is detected.

**Example User Input:**

> "I bought groceries today for $45"

**Gemini Response:**

```json
{
  "message": "I noticed you spent money on groceries. Would you like me to log this expense?",
  "hasAction": true,
  "transaction": {
    "type": "expense",
    "title": "Groceries",
    "amount": 45.00,
    "category": "Food"
  }
}
```

The frontend renders a DaisyUI Alert/Card with a "➕ Add Expense" button inside the chat UI, letting users confirm the addition with a single click!

### Chat API

`POST /api/chat` — session-protected, signed-in users only (401 otherwise).

**Request**

```json
{ "message": "I bought groceries today for $45" }
```

**Response (transaction detected)**

```json
{
  "message": "I noticed you spent money on groceries. Would you like me to log this expense?",
  "hasAction": true,
  "transaction": {
    "type": "expense",
    "title": "Groceries",
    "amount": 45,
    "category": "Food"
  }
}
```

**Response (no transaction)**

```json
{ "message": "Great question!", "hasAction": false }
```

Malformed or empty bodies return `400`, oversized messages return `413`. Conversation content is never logged; the route retries once on a transient Gemini error before returning a friendly fallback.

## ☁️ Deploying to Vercel

1. Push your repository to GitHub.
2. Go to Vercel and click "Add New Project".
3. Import the budgetiq GitHub repository.
4. Add your Environment Variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SITE_URL` (set to your production URL `https://your-app.vercel.app`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `GEMINI_API_KEY`
   - `API_NINJAS_API_KEY`
5. Click Deploy! 🚀

> OAuth note: after deploying, add your production URL to Supabase ➔ Authentication ➔ URL Configuration ➔ Redirect URLs (e.g. `https://your-app.vercel.app/auth/callback`) so Google sign-in redirects back to production.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🧠 AI Skill Credits

- The **TaskFlow** agent skill (`.opencode/skills/taskflow`) was created by **invictusdhahri** — [github.com/invictusdhahri/taskflow](https://github.com/invictusdhahri/taskflow).

## 🤝 Contributing

Contributions are welcome! Feel free to open an Issue or submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request and push it in to main
