-- ============================================================
--  V145 : Fix discounts text columns accidentally stored as BYTEA
--
-- Some environments may have created discounts.title or
-- discounts.note as BYTEA. That breaks LOWER()/LIKE queries.
-- Convert the affected columns back to readable text types safely.
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'discounts'
          AND column_name = 'title'
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE discounts
            ALTER COLUMN title TYPE VARCHAR(255)
            USING convert_from(title, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'discounts'
          AND column_name = 'discount_type'
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE discounts
            ALTER COLUMN discount_type TYPE VARCHAR(50)
            USING convert_from(discount_type, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'discounts'
          AND column_name = 'note'
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE discounts
            ALTER COLUMN note TYPE TEXT
            USING convert_from(note, 'UTF8');
    END IF;
END $$;
