-- BudgetIQ Supabase security verification & hardening checks
-- Run in Supabase Dashboard: SQL Editor → New query (use staging first when possible).
-- Review results before running any mutating statements. Prefer wrapping tests in BEGIN/ROLLBACK.

-- ============================================================
-- A) currency_rates (migration 0010): RLS, policies, grants
-- ============================================================

-- A1. Confirm table exists and RLS is enabled
select n.nspname as schema, c.relname as table, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'currency_rates';

-- A2. Confirm policies (expect: SELECT policy for anon,authenticated using true; no INSERT/UPDATE/DELETE policies for client roles)
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'currency_rates'
order by policyname;

-- A3. Inspect effective table grants (scope to currency_rates)
-- If you see anon/authenticated with INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER: harden with A4.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'currency_rates'
order by grantee, privilege_type;

-- A4. Hardening (run if A3 shows excessive anon/authenticated privileges)
-- RLS blocks writes without policies, but revoking table privileges is defense-in-depth.
-- Service role is used for server-side cache refresh and bypasses RLS; keep its privileges.
-- Postgres/owner privileges can remain as-is.
-- REVIEW before running:
-- REVOKE ALL PRIVILEGES ON TABLE public.currency_rates FROM anon, authenticated;
-- GRANT SELECT ON TABLE public.currency_rates TO anon, authenticated;
-- Then re-run A3 to confirm anon/authenticated have only SELECT.

-- A5. Functional access simulation (safe in a transaction)
-- Note: SQL Editor usually runs as postgres (bypasses RLS). SET ROLE simulates client privilege context.
begin;

set local role anon;
select currency, rate_to_usd, fetched_at from public.currency_rates limit 5;
-- Uncomment ONE at a time to verify writes are denied (expect error), then keep rolled back:
-- insert into public.currency_rates (currency, rate_to_usd, fetched_at) values ('ZZZ', 1.0, now());
-- update public.currency_rates set rate_to_usd = 1.0 where currency = 'USD';
-- delete from public.currency_rates where currency = 'USD';
reset role;

set local role authenticated;
select currency, rate_to_usd, fetched_at from public.currency_rates limit 5;
-- Uncomment to verify denied:
-- insert into public.currency_rates (currency, rate_to_usd, fetched_at) values ('ZZZ', 1.0, now());
-- update public.currency_rates set rate_to_usd = 1.0 where currency = 'USD';
-- delete from public.currency_rates where currency = 'USD';
reset role;

rollback;

-- A6. Service-role cache refresh (app-level): after SUPABASE_SERVICE_ROLE_KEY is configured server-side,
-- trigger currency-rates refresh in app, then verify:
-- select currency, rate_to_usd, fetched_at from public.currency_rates order by currency;


-- ============================================================
-- B) custom_kpis (migration 0007): RLS, policies, tenant isolation
-- ============================================================

-- B1. Confirm table exists and RLS is enabled
select n.nspname as schema, c.relname as table, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'custom_kpis';

-- B2. Confirm RLS policy enforces ownership (expect auth.uid() = user_id in qual and with_check)
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'custom_kpis'
order by policyname;

-- B3. Inspect grants (look for unexpected anon privileges or overly broad extra grants)
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'custom_kpis'
order by grantee, privilege_type;

-- B4. List candidate test users (pick two real staging users: User A and User B)
select id, email, created_at
from auth.users
order by created_at desc
limit 20;

-- B5. (Optional) As postgres in staging, find a KPI owned by User B for cross-tenant target (<KPI_B_ID>)
-- select id, user_id, title, created_at from public.custom_kpis where user_id = '<USER_B_UUID>' order by created_at desc limit 20;

-- B6. Tenant isolation simulation as User A (replace UUID placeholders)
begin;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', '<USER_A_UUID>', 'role', 'authenticated')::text, true);
select set_config('request.jwt.claim.sub', '<USER_A_UUID>', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- B6.1 Own rows only (should not include User B rows)
select id, user_id, title, source_type, operation from public.custom_kpis order by created_at desc;

-- B6.2 Read User B's KPI by id (expect 0 rows)
-- select id, user_id, title from public.custom_kpis where id = '<KPI_B_ID>';

-- B6.3 Update User B's KPI (expect 0 rows updated)
-- update public.custom_kpis set title = 'cross-tenant-update-attempt' where id = '<KPI_B_ID>' returning id, user_id, title;

-- B6.4 Delete User B's KPI (expect 0 rows deleted)
-- delete from public.custom_kpis where id = '<KPI_B_ID>' returning id, user_id;

-- B6.5 Insert forging another user_id (expect RLS WITH CHECK violation)
-- insert into public.custom_kpis (user_id, title, source_type, operation)
-- values ('<USER_B_UUID>', 'forged-owner', 'expense', 'sum') returning id, user_id;

-- B6.6 Insert as self (expect success inside tx, rolled back)
-- insert into public.custom_kpis (user_id, title, source_type, operation)
-- values ('<USER_A_UUID>', 'self-test-kpi', 'expense', 'sum') returning id, user_id, title;

rollback;

-- B7. Repeat B6 as User B (<USER_B_UUID>) for symmetric isolation.
-- B8. App-level staging: sign in as A/B and confirm cross-user KPI read/update/delete is denied.
