-- Harden client privileges on user-owned tables. RLS policies remain the
-- primary tenant-isolation boundary; remove anonymous direct table access and
-- grant only required DML to authenticated clients.

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_budget_plans ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.transactions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.salary_budget_plans FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.salary_budget_plans TO authenticated;
