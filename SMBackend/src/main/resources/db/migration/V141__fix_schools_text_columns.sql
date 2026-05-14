-- ============================================================
--  V141 : Fix schools text columns accidentally stored as BYTEA
--
-- Some environments ended up with schools.school_name / email / phone
-- created as BYTEA. This breaks search queries that use LOWER()/LIKE.
-- Convert those columns back to VARCHAR safely (only if they are BYTEA).
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'schools'
          AND column_name = 'school_name'
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE schools
            ALTER COLUMN school_name TYPE VARCHAR(255)
            USING convert_from(school_name, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'schools'
          AND column_name = 'email'
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE schools
            ALTER COLUMN email TYPE VARCHAR(255)
            USING convert_from(email, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'schools'
          AND column_name = 'phone'
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE schools
            ALTER COLUMN phone TYPE VARCHAR(50)
            USING convert_from(phone, 'UTF8');
    END IF;
END $$;

