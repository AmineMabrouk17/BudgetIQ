# 🤖 BudgetIQ - AI-Powered Personal Finance & Budget Planner

BudgetIQ is an open-source, intelligent personal finance manager. It features Google & Discord authentication, interactive financial tracking (Salary, Expenses, Assets), daily motivational quotes, and a built-in AI chatbot powered by the Google Gemini Free API that can naturally parse user conversation and automatically suggest adding transactions directly to your dashboard.

## 🌟 Features

- 🔐 **Authentication**: Single-click OAuth Login with Google & Discord via Supabase Auth.
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
- **AI Engine**: Google Gemini API (gemini-1.5-flash)
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
│   └── gemini.ts           # Gemini AI SDK setup & prompts
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
npm install daisyui@latest @supabase/supabase-js @supabase/ssr @google/generative-ai lucide-react
```

### 3. Setup Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Next.js Public Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API Key
GEMINI_API_KEY=your-gemini-api-key
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

### 5. Configure OAuth Providers in Supabase

1. Navigate to Supabase Dashboard ➔ Authentication ➔ Providers.
2. **Google Setup**: Enable Google and paste your Client ID & Client Secret from Google Cloud Console.
3. **Discord Setup**: Enable Discord and paste your Client ID & Client Secret from Discord Developer Portal.
4. Add Callback URL in both Google & Discord:
   `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`

### 6. Run Locally

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

The chatbot uses Gemini's `gemini-1.5-flash` model. When a user chats with the AI, the system prompt forces Gemini to respond with structured JSON whenever an expense, income, or asset action is detected.

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

## ☁️ Deploying to Vercel

1. Push your repository to GitHub.
2. Go to Vercel and click "Add New Project".
3. Import your budgetiq GitHub repository.
4. Add your Environment Variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SITE_URL` (set to your production URL `https://your-app.vercel.app`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Click Deploy! 🚀

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
