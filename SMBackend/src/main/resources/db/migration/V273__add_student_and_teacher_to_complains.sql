-- V273__add_student_and_teacher_to_complains.sql

ALTER TABLE complains
    ADD COLUMN IF NOT EXISTS student_id BIGINT,
    ADD COLUMN IF NOT EXISTS teacher_id BIGINT;

DO $$
BEGIN
    ALTER TABLE complains
        ADD CONSTRAINT fk_complains_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE complains
        ADD CONSTRAINT fk_complains_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_complains_student_id ON complains (student_id);
CREATE INDEX IF NOT EXISTS idx_complains_teacher_id ON complains (teacher_id);
