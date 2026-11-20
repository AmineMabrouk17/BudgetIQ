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

-- Defense in depth: remove direct table privileges from client roles and grant
-- read-only access explicitly. No INSERT/UPDATE/DELETE policies exist for
-- anon/authenticated; service_role bypasses RLS for server-side cache refresh.
REVOKE ALL PRIVILEGES ON TABLE public.currency_rates FROM anon, authenticated;
GRANT SELECT ON TABLE public.currency_rates TO anon, authenticated;
