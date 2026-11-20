# Applying Database Migrations

## Option A — Supabase Dashboard (recommended)

1. Open https://supabase.com/dashboard and select your project.
2. Click **SQL Editor** in the left sidebar, then **New query**.
3. Copy the contents of the target file under `supabase/migrations/` into the editor.
4. Click **Run** (or Cmd+Enter).

## Option B — Supabase CLI

Only if the project is linked:

```bash
supabase db push
```

## Verifying a migration

Run in the SQL Editor to inspect the table:

```sql
\d transactions
```

Confirm the table columns exist, RLS is enabled, the policy is listed, and indexes are present.

## Migrations

| File | Applied? | Verified? |
|------|----------|-----------|
| `supabase/migrations/0001_transactions.sql` | Yes — applied via SQL Editor | Yes — table, columns, and RLS confirmed via PostgREST |
| `supabase/migrations/0002_profiles.sql` | | |
| `supabase/migrations/0003_profiles_sync_update.sql` | | |

| `supabase/migrations/0004_currency_rates.sql` | | |
| `supabase/migrations/0005_profiles_income_fields.sql` | | |
| `supabase/migrations/0006_transaction_scope.sql` | | |
| `supabase/migrations/0007_custom_kpis.sql` | | |
| `supabase/migrations/0008_salary_budget_plans.sql` | | |
| `supabase/migrations/0009_onboarded_flag_backfill.sql` | | |
| `supabase/migrations/0010_currency_rates_rls.sql` | | |
