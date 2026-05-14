-- ============================================================
--  V147 : Fix fee_types text columns accidentally stored as BYTEA
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'fee_types'
          AND column_name = 'fee_type' AND data_type = 'bytea'
    ) THEN
        ALTER TABLE fee_types ALTER COLUMN fee_type TYPE VARCHAR(100)
            USING convert_from(fee_type, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'fee_types'
          AND column_name = 'title' AND data_type = 'bytea'
    ) THEN
        ALTER TABLE fee_types ALTER COLUMN title TYPE VARCHAR(255)
            USING convert_from(title, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'fee_types'
          AND column_name = 'note' AND data_type = 'bytea'
    ) THEN
        ALTER TABLE fee_types ALTER COLUMN note TYPE TEXT
            USING convert_from(note, 'UTF8');
    END IF;
END $$;
