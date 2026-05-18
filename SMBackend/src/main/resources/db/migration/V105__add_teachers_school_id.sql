-- ============================================================
--  V105 : teachers.school_id (for tenant scoping)
-- ============================================================

ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS school_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_teachers_school'
    ) THEN
        ALTER TABLE teachers
            ADD CONSTRAINT fk_teachers_school FOREIGN KEY (school_id) REFERENCES schools(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);

