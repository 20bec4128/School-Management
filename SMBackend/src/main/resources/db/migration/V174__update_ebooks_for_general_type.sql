DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'ebooks'
    ) THEN
        ALTER TABLE ebooks
            ADD COLUMN IF NOT EXISTS ebook_type VARCHAR(32) NOT NULL DEFAULT 'SUBJECT';

        UPDATE ebooks
        SET ebook_type = 'SUBJECT'
        WHERE ebook_type IS NULL OR TRIM(ebook_type) = '';

        ALTER TABLE ebooks
            ALTER COLUMN class_id DROP NOT NULL;

        ALTER TABLE ebooks
            ALTER COLUMN subject_id DROP NOT NULL;
    END IF;
END $$;

