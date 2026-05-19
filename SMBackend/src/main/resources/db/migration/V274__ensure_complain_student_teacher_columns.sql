-- V274__ensure_complain_student_teacher_columns.sql

ALTER TABLE complains
    ADD COLUMN IF NOT EXISTS student_id BIGINT;

ALTER TABLE complains
    ADD COLUMN IF NOT EXISTS teacher_id BIGINT;

CREATE INDEX IF NOT EXISTS idx_complains_student_id ON complains (student_id);
CREATE INDEX IF NOT EXISTS idx_complains_teacher_id ON complains (teacher_id);
