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
| `supabase/migrations/0007_custom_kpis.sql` | Applied/effective in linked env `xofcqnuhgowbfquovcea` (BudgetIQ, CLI-verified 2026-11-20); record status per other environment | **DB-verified in linked env:** RLS enabled, policy `Users can manage their own KPIs` (ALL, `auth.uid() = user_id`, WITH CHECK same). SQL isolation test (temp rows, rollback): as User A visible=1 own, read/update/delete User B=0 and forged insert as B rejected by RLS; symmetric for User B. **Still required:** app-level/staging cross-user UI/action validation and per-environment status. |
| `supabase/migrations/0008_salary_budget_plans.sql` | | |
| `supabase/migrations/0009_onboarded_flag_backfill.sql` | | |
| `supabase/migrations/0010_currency_rates_rls.sql` | Applied/effective in linked env `xofcqnuhgowbfquovcea` (BudgetIQ, CLI-verified 2026-11-20); record status per other environment | **DB-verified in linked env:** RLS enabled, SELECT-only policy `Anyone can read currency rates` for `anon,authenticated` (`USING true`), and client table grants reduced to `SELECT` for `anon/authenticated` (postgres/service_role retain privileges; service_role bypasses RLS). Client-role write attempts denied (permission denied). **Still required:** verify server-side `SUPABASE_SERVICE_ROLE_KEY` cache refresh in deployed app/runtime and mark each environment separately. |
| `supabase/migrations/0011_custom_kpis_grants_hardening.sql` | Applied in linked env `xofcqnuhgowbfquovcea` (BudgetIQ, CLI-verified 2026-11-20); record status per other environment | Revoked anon client table privileges on `custom_kpis` and granted authenticated DML only; RLS ownership policy remains required. Verify app behavior and grants in every environment. |
| `supabase/migrations/0012_user_table_grants_hardening.sql` | Applied in linked env `xofcqnuhgowbfquovcea` (BudgetIQ, CLI-verified 2026-11-20); record status per other environment | Revoked anon client table privileges on `transactions`, `profiles`, `salary_budget_plans` and granted authenticated DML only; RLS policies remain required. Verify app behavior and grants in every environment. |

## Security/deployment follow-up checklist (source-audited)

These are repo-documented actions and cannot be fully completed from source alone:

- **Admin auth:** Set a strong `ADMIN_PASSWORD` in every environment before exposing `/admin`. The app now fails closed when it is unset and uses signed, expiring admin session tokens.
- **Service role:** Configure `SUPABASE_SERVICE_ROLE_KEY` server-side where required for admin user listing and currency-rate cache refresh. Never expose it to clients.
- **Credential hygiene:** Rotate/revoke any Supabase tokens, database passwords, or other secrets ever exposed in chat, logs, screenshots, or untrusted channels. Store reusable CLI credentials only in protected local config outside git.
- **Migration rollout:** Apply `supabase/migrations/0010_currency_rates_rls.sql`, `0011_custom_kpis_grants_hardening.sql`, and `0012_user_table_grants_hardening.sql` (or rerun `supabase/apply-all.sql`) in each database environment and verify effective RLS/grants/policies, migration history, and runtime behavior.
- **Trusted ingress/proxy headers:** By default the app does not trust generic `X-Forwarded-For`/`X-Real-IP` headers. On Vercel/Cloudflare the platform headers are used automatically. For self-hosted deployments behind a trusted reverse proxy, set `TRUST_PROXY_HEADERS=true` only when the proxy strips/overwrites spoofed forwarding headers and blocks direct-origin access. Login rate limiting and Turnstile `remoteip` depend on that deployment boundary; monitor requests attributed to `unknown`.
- **Preview bypass:** Preview QA bypass is limited to `VERCEL_ENV=preview` with a configured `PREVIEW_TEST_SECRET`, a short signed timestamp window, and a reduced-scope demo user. Do not set preview-bypass vars in production; treat captured signatures as short-lived and keep preview environments isolated.
- **CI/workflow trust boundaries:** Workflows now split untrusted PR-code capture from trusted publish steps, restrict privileged automation to trusted same-repo/collaborator contexts where applicable, keep PR notifications secret-isolated from PR code, and pin deploy CLIs. This reduces but does not eliminate risk: self-hosted/privileged automation still requires isolated/ephemeral runners, minimal ambient credentials, protected branches/environments, required reviews/approvals, and trusted repo governance.
- **Session/revocation & door parity:** Local JWT verification avoids definitive-error downgrades but cannot replace all server-side session revocation semantics. Validate authenticated page, server action, and API behavior (including revoked/rotated sessions and admin access) in staging with production-like routing.
- **Staging/CI/audit:** Run CI on GitHub, test in staging after deployment, and re-run the security audit with deployment/runtime evidence to confirm unresolved findings are fixed, refuted, or explicitly accepted before a security-cleared merge.
