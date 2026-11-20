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
| `supabase/migrations/0007_custom_kpis.sql` | Applied/effective in linked env `xofcqnuhgowbfquovcea` (BudgetIQ, CLI-verified 2026-11-20); record status per other environment | **DB-verified in linked env:** RLS enabled, policy `Users can manage their own KPIs` (ALL, `auth.uid() = user_id`, WITH CHECK same). SQL isolation test (temp rows, rollback): as User A visible=1 own, read/update/delete User B=0 and forged insert as B rejected by RLS; symmetric for User B. **Note:** client-role table grants remain broad in this env but RLS enforces ownership; review least-privilege grants per policy if desired. **Still required:** app-level/staging cross-user UI/action validation and per-environment status. |
| `supabase/migrations/0008_salary_budget_plans.sql` | | |
| `supabase/migrations/0009_onboarded_flag_backfill.sql` | | |
| `supabase/migrations/0010_currency_rates_rls.sql` | Applied/effective in linked env `xofcqnuhgowbfquovcea` (BudgetIQ, CLI-verified 2026-11-20); record status per other environment | **DB-verified in linked env:** RLS enabled, SELECT-only policy `Anyone can read currency rates` for `anon,authenticated` (`USING true`), and client table grants reduced to `SELECT` for `anon/authenticated` (postgres/service_role retain privileges; service_role bypasses RLS). Client-role write attempts denied (permission denied). **Still required:** verify server-side `SUPABASE_SERVICE_ROLE_KEY` cache refresh in deployed app/runtime and mark each environment separately. |

## Security/deployment follow-up checklist (source-audited)

These are repo-documented actions and cannot be fully completed from source alone:

- **Admin auth:** Set a strong `ADMIN_PASSWORD` in every environment before exposing `/admin`. The app now fails closed when it is unset and uses signed, expiring admin session tokens.
- **Service role:** Configure `SUPABASE_SERVICE_ROLE_KEY` server-side where required for admin user listing and currency-rate cache refresh. Never expose it to clients.
- **Migration 0010 rollout:** Apply `supabase/migrations/0010_currency_rates_rls.sql` (or rerun `supabase/apply-all.sql`) in each database environment and verify effective RLS/grants/policies and cache refresh behavior.
- **Trusted ingress/proxy headers:** Verify which client-IP header is authoritative at the edge/proxy and that spoofed forwarding headers are stripped/overwritten. Login rate limiting and Turnstile `remoteip` depend on that deployment boundary; monitor requests attributed to `unknown`.
- **CI/workflow trust boundaries:** Current workflows include mitigations (reduced permissions, same-repo PR guards for privileged automation, trusted-ref PR-body update, Telegram secret isolation from PR code, pinned deploy CLIs), but self-hosted/privileged automation still requires runner isolation, secret scoping, and repo governance review before relying on it in production.
- **Session/revocation parity:** Local JWT verification avoids definitive-error downgrades but cannot replace all server-side session revocation semantics; validate behavior in staging for your Supabase token/session configuration and edge/runtime paths.
- **Staging/CI/audit:** Run CI on GitHub, test in staging after deployment, and re-run the security audit in a capable sandbox to confirm unresolved findings are fixed, refuted, or explicitly accepted.
