-- ============================================================
--  V143 : Fix salary_grades text columns accidentally stored as BYTEA
--
-- Some environments may have created salary_grades.grade_name as BYTEA.
-- That breaks case-insensitive search queries that use LOWER()/LIKE.
-- Convert the affected columns back to readable text types safely.
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'salary_grades'
          AND column_name = 'grade_name'
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE salary_grades
            ALTER COLUMN grade_name TYPE VARCHAR(255)
            USING convert_from(grade_name, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'salary_grades'
          AND column_name = 'note'
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE salary_grades
            ALTER COLUMN note TYPE TEXT
            USING convert_from(note, 'UTF8');
    END IF;
END $$;
