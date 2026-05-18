ALTER TABLE class_lectures
    ADD COLUMN IF NOT EXISTS lesson_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_class_lectures_lesson'
    ) THEN
        ALTER TABLE class_lectures
            ADD CONSTRAINT fk_class_lectures_lesson
            FOREIGN KEY (lesson_id) REFERENCES lessons(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_class_lectures_lesson_id
    ON class_lectures(lesson_id);
