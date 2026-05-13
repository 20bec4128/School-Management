ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS designation_id BIGINT;

ALTER TABLE teachers
    ADD COLUMN IF NOT EXISTS designation_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_teachers_designation_id ON teachers (designation_id);

