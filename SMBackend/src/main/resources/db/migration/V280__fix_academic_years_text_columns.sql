-- ============================================================
--  V280 : Fix academic_years text columns accidentally stored as BYTEA
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'academic_years'
          AND column_name = 'academic_year' AND data_type = 'bytea'
    ) THEN
        ALTER TABLE academic_years ALTER COLUMN academic_year TYPE VARCHAR(50)
            USING convert_from(academic_year, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'academic_years'
          AND column_name = 'note' AND data_type = 'bytea'
    ) THEN
        ALTER TABLE academic_years ALTER COLUMN note TYPE TEXT
            USING convert_from(note, 'UTF8');
    END IF;
END $$;
