-- Income-profile fields for Calendar-month KPIs.
-- income_type is NULL for new users so the onboarding gate forces a pick
-- before reaching the dashboard; existing rows are backfilled to 'salaried'
-- so current users are not blocked.

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

-- Keep existing users unblocked: any profile existing before this migration
-- gets salaried as an explicit (non-null) income_type.
UPDATE public.profiles
SET income_type = 'salaried'
WHERE income_type IS NULL;

-- Drop and re-create the user-owned-row UPDATE policy so the new columns are
-- covered under the same RLS rule (auth.uid() = id).
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);