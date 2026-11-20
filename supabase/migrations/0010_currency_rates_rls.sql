-- Harden currency_rates: public reference data should be readable but not
-- client-writable. Server-side cache refresh uses the service role key, which
-- bypasses RLS.
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read currency rates" ON public.currency_rates;
CREATE POLICY "Anyone can read currency rates"
ON public.currency_rates
FOR SELECT
TO anon, authenticated
USING (true);

-- No INSERT/UPDATE/DELETE policies for anon/authenticated roles: only the
-- service role (which bypasses RLS) may mutate cached rates.
