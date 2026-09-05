-- Add business/personal scope to transactions.
-- Existing rows default to 'personal' via the column default.

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS scope VARCHAR(10)
        DEFAULT 'personal'
        NOT NULL
        CHECK (scope IN ('business', 'personal'));
