-- Migration 0008: Salary Budget Plans and AI Conversation persistence
CREATE TABLE IF NOT EXISTS public.salary_budget_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_salary NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_salary >= 0),
    has_dependents BOOLEAN NOT NULL DEFAULT false, -- false: 3-6 months emergency fund, true: 12 months
    
    -- Actual values tracked by the user or extracted by Gemini
    actual_essentials NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (actual_essentials >= 0),
    actual_lifestyle NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (actual_lifestyle >= 0),
    actual_emergency_fund NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (actual_emergency_fund >= 0),
    actual_investments NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (actual_investments >= 0),

    -- Persistent chat history with Gemini: [{ id, role, content, timestamp }]
    chat_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_advice TEXT DEFAULT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT uq_salary_budget_plans_user UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.salary_budget_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own salary budget plan"
ON public.salary_budget_plans
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);