-- In-order migration companion to V200.
-- Some environments disable Flyway out-of-order migrations, so V200 may never apply.
-- This migration is intentionally idempotent and safe to run even if V200 already ran.

ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS father_email VARCHAR(150);
ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS mother_email VARCHAR(150);
ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(150);

