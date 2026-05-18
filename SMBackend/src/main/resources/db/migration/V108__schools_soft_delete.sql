-- ============================================================
--  V108 : Schools soft delete fields + defaults
-- ============================================================

ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100) NULL;

-- Normalize existing rows (status was previously free-form/nullable)
UPDATE schools
SET status = CASE
    WHEN status IS NULL OR BTRIM(status) = '' THEN 'ACTIVE'
    WHEN UPPER(BTRIM(status)) IN ('ACTIVE', 'INACTIVE') THEN UPPER(BTRIM(status))
    ELSE 'ACTIVE'
END;

ALTER TABLE schools
    ALTER COLUMN status SET DEFAULT 'ACTIVE';

ALTER TABLE schools
    ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_schools_status'
    ) THEN
        ALTER TABLE schools
            ADD CONSTRAINT chk_schools_status CHECK (status IN ('ACTIVE', 'INACTIVE'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_schools_active ON schools(is_deleted, status);
