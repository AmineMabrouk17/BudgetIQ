-- Exchange-rate cache for the display-currency conversion (ADR-0001)
-- One row per currency: its rate to the fixed base currency (USD).
-- The server refreshes rows when fetched_at is older than ~24h and falls
-- back to stale rates when the rates API is unavailable.
CREATE TABLE IF NOT EXISTS public.currency_rates (
    currency CHAR(3) PRIMARY KEY,
    rate_to_usd NUMERIC(12, 6) NOT NULL CHECK (rate_to_usd > 0),
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Public reference data, not user data; no RLS policies are needed.
