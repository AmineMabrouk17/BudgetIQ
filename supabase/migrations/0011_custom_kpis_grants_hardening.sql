-- Harden custom_kpis client privileges: rely on RLS for tenant isolation and
-- remove anonymous direct table access while keeping authenticated access.
-- RLS policy (auth.uid() = user_id) remains the ownership boundary.

ALTER TABLE public.custom_kpis ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.custom_kpis FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.custom_kpis TO authenticated;
