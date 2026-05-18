CREATE TABLE IF NOT EXISTS exam_instructions (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    instruction TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_exam_instructions_school
        FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_exam_instructions_school_id
    ON exam_instructions(school_id);

CREATE INDEX IF NOT EXISTS idx_exam_instructions_status
    ON exam_instructions(status);
