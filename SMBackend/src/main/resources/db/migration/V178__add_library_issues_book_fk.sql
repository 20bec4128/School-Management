DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'books'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_library_issues_book'
    ) THEN
        ALTER TABLE library_issues
            ADD CONSTRAINT fk_library_issues_book
            FOREIGN KEY (book_id) REFERENCES books(id);
    END IF;
END $$;
