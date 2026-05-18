CREATE TABLE IF NOT EXISTS online_exams (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    exam_title VARCHAR(255) NOT NULL,
    instruction TEXT,
    duration INTEGER,
    start_date DATE,
    end_date DATE,
    mark_type VARCHAR(100),
    pass_mark DOUBLE PRECISION,
    is_publish VARCHAR(50) DEFAULT 'Draft',
    exam_limit INTEGER,
    note TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_online_exams_school
        FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_online_exams_class
        FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_online_exams_section
        FOREIGN KEY (section_id) REFERENCES sections(id),
    CONSTRAINT fk_online_exams_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE INDEX IF NOT EXISTS idx_online_exams_school_id
    ON online_exams(school_id);

CREATE INDEX IF NOT EXISTS idx_online_exams_class_id
    ON online_exams(class_id);

CREATE INDEX IF NOT EXISTS idx_online_exams_section_id
    ON online_exams(section_id);

CREATE INDEX IF NOT EXISTS idx_online_exams_subject_id
    ON online_exams(subject_id);
