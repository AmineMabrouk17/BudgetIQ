-- Backfill the `onboarded` flag in `auth.users.raw_user_meta_data`.
--
-- The dashboard layout reads onboarding status from the verified access token
-- instead of querying `profiles`, and tokens carry `user_metadata`. Users who
-- onboarded before that change have a complete `profiles` row but no flag, so
-- without this the layout would send them back to /onboarding indefinitely.
--
-- The flag lands in `raw_user_meta_data` (not `raw_app_meta_data`) so that it
-- is included in the `user_metadata` claim of every access token issued from
-- now on. Existing tokens keep their old claims until they are refreshed,
-- which the layout tolerates by falling back to the profile row.

UPDATE auth.users AS u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('onboarded', true)
FROM public.profiles AS p
WHERE p.id = u.id
  AND p.income_type IS NOT NULL
  AND COALESCE(u.raw_user_meta_data -> 'onboarded', 'false'::jsonb) <> 'true'::jsonb;
