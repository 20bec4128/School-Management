ALTER TABLE class_lectures
    ADD COLUMN IF NOT EXISTS lesson_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = current_schema()
          AND table_name = 'class_lectures'
          AND constraint_name = 'fk_class_lectures_lesson'
    ) THEN
        ALTER TABLE class_lectures
            ADD CONSTRAINT fk_class_lectures_lesson
            FOREIGN KEY (lesson_id) REFERENCES lessons(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_class_lectures_lesson_id
    ON class_lectures(lesson_id);
