CREATE TABLE IF NOT EXISTS question_bank (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT,
    subject_id BIGINT NOT NULL,
    question_level VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    image_path TEXT,
    document_path TEXT,
    mark DOUBLE PRECISION,
    question_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_question_bank_school
        FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_question_bank_class
        FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_question_bank_section
        FOREIGN KEY (section_id) REFERENCES sections(id),
    CONSTRAINT fk_question_bank_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE INDEX IF NOT EXISTS idx_question_bank_school_id
    ON question_bank(school_id);

CREATE INDEX IF NOT EXISTS idx_question_bank_class_id
    ON question_bank(class_id);

CREATE INDEX IF NOT EXISTS idx_question_bank_section_id
    ON question_bank(section_id);

CREATE INDEX IF NOT EXISTS idx_question_bank_subject_id
    ON question_bank(subject_id);

