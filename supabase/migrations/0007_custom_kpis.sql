-- Custom KPI cards: user-owned, formula-driven dashboard metrics.

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

CREATE POLICY "Users can manage their own KPIs"
    ON public.custom_kpis
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
