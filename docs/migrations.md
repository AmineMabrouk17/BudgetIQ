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
| `supabase/migrations/0010_currency_rates_rls.sql` | Applied in at least one environment (user-reported); per-environment status must be recorded | **Verification pending/hardening required:** run `supabase/verification/0010_0007_security_checks.sql` (A1–A6). Confirm RLS enabled and SELECT-only policy present. If `anon/authenticated` still have INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER grants (as observed in one check), execute A4 revoke/grant hardening, re-run A3/A5, and verify service-role cache refresh works. Mark verified only after effective state is confirmed in each environment. |

## Security/deployment follow-up checklist (source-audited)

These are repo-documented actions and cannot be fully completed from source alone:

- **Admin auth:** Set a strong `ADMIN_PASSWORD` in every environment before exposing `/admin`. The app now fails closed when it is unset and uses signed, expiring admin session tokens.
- **Service role:** Configure `SUPABASE_SERVICE_ROLE_KEY` server-side where required for admin user listing and currency-rate cache refresh. Never expose it to clients.
- **Migration 0010 rollout:** Apply `supabase/migrations/0010_currency_rates_rls.sql` (or rerun `supabase/apply-all.sql`) in each database environment and verify effective RLS/grants/policies and cache refresh behavior.
- **Trusted ingress/proxy headers:** Verify which client-IP header is authoritative at the edge/proxy and that spoofed forwarding headers are stripped/overwritten. Login rate limiting and Turnstile `remoteip` depend on that deployment boundary; monitor requests attributed to `unknown`.
- **CI/workflow trust boundaries:** Current workflows include mitigations (reduced permissions, same-repo PR guards for privileged automation, trusted-ref PR-body update, Telegram secret isolation from PR code, pinned deploy CLIs), but self-hosted/privileged automation still requires runner isolation, secret scoping, and repo governance review before relying on it in production.
- **Session/revocation parity:** Local JWT verification avoids definitive-error downgrades but cannot replace all server-side session revocation semantics; validate behavior in staging for your Supabase token/session configuration and edge/runtime paths.
- **Staging/CI/audit:** Run CI on GitHub, test in staging after deployment, and re-run the security audit in a capable sandbox to confirm unresolved findings are fixed, refuted, or explicitly accepted.
