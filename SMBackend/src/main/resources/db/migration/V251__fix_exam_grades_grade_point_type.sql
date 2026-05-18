DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'exam_grades'
    ) THEN
        ALTER TABLE exam_grades
            ALTER COLUMN grade_point TYPE DOUBLE PRECISION
            USING grade_point::DOUBLE PRECISION;
    END IF;
END $$;
