-- Combined BudgetIQ migration (run once in Supabase SQL Editor).
-- Safe to re-run: every statement uses IF NOT EXISTS / DROP IF EXISTS.
-- Apply in order: this file is migrations 0001..0010 concatenated.

SET search_path = public;

-- ===== 0001_transactions.sql =====
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense', 'asset')) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions"
ON public.transactions
FOR ALL
USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_created_at_idx
ON public.transactions (user_id, created_at DESC);

-- ===== 0002_profiles.sql =====
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT id, COALESCE(email, raw_user_meta_data->>'email'),
       COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
       COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ===== 0003_profiles_sync_update.sql =====
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.email IS DISTINCT FROM OLD.email
       OR NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
        INSERT INTO public.profiles (id, email, full_name, avatar_url)
        VALUES (
            NEW.id,
            COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
            COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
            avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
            updated_at = now();
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_update();

-- ===== 0004_currency_rates.sql =====
CREATE TABLE IF NOT EXISTS public.currency_rates (
    currency CHAR(3) PRIMARY KEY,
    rate_to_usd NUMERIC(12, 6) NOT NULL CHECK (rate_to_usd > 0),
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===== 0005_profiles_income_fields.sql =====
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS income_type TEXT
        DEFAULT NULL
        CHECK (income_type IN ('salaried', 'hourly', 'freelancer', 'business'));
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS payday SMALLINT
        DEFAULT NULL
        CHECK (payday IS NULL OR (payday BETWEEN 1 AND 31));
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS expected_income NUMERIC(12, 2)
        DEFAULT NULL
        CHECK (expected_income IS NULL OR expected_income > 0);
UPDATE public.profiles SET income_type = 'salaried' WHERE income_type IS NULL;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ===== 0006_transaction_scope.sql =====
ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS scope VARCHAR(10)
        DEFAULT 'personal'
        NOT NULL
        CHECK (scope IN ('business', 'personal'));

-- ===== 0007_custom_kpis.sql =====
CREATE TABLE IF NOT EXISTS public.custom_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) <= 60),
    source_type TEXT NOT NULL CHECK (source_type IN ('income', 'expense', 'balance', 'category')),
    category_filter TEXT,
    scope TEXT DEFAULT 'all' CHECK (scope IN ('all', 'personal', 'business')),
    timeframe TEXT DEFAULT 'this_month' CHECK (timeframe IN ('this_month', 'last_month', 'last_30_days', 'year_to_date', 'all_time')),
    operation TEXT NOT NULL CHECK (operation IN ('sum', 'percentage', 'budget_remaining')),
    operand NUMERIC(12, 2) DEFAULT 1.0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.custom_kpis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own KPIs" ON public.custom_kpis;
CREATE POLICY "Users can manage their own KPIs"
    ON public.custom_kpis
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ===== 0008_salary_budget_plans.sql =====
CREATE TABLE IF NOT EXISTS public.salary_budget_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_salary NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_salary >= 0),
    has_dependents BOOLEAN NOT NULL DEFAULT false,
    actual_essentials NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (actual_essentials >= 0),
    actual_lifestyle NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (actual_lifestyle >= 0),
    actual_emergency_fund NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (actual_emergency_fund >= 0),
    actual_investments NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (actual_investments >= 0),
    chat_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_advice TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_salary_budget_plans_user UNIQUE (user_id)
);
ALTER TABLE public.salary_budget_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own salary budget plan" ON public.salary_budget_plans;
CREATE POLICY "Users can manage their own salary budget plan"
ON public.salary_budget_plans
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ===== 0009_onboarded_flag_backfill.sql =====
UPDATE auth.users AS u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('onboarded', true)
FROM public.profiles AS p
WHERE p.id = u.id
  AND p.income_type IS NOT NULL
  AND COALESCE(u.raw_user_meta_data -> 'onboarded', 'false'::jsonb) <> 'true'::jsonb;

-- ===== 0010_currency_rates_rls.sql =====
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read currency rates" ON public.currency_rates;
CREATE POLICY "Anyone can read currency rates"
ON public.currency_rates
FOR SELECT
TO anon, authenticated
USING (true);
