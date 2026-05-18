CREATE TABLE IF NOT EXISTS exam_terms (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    grade_name VARCHAR(255) NOT NULL,
    grade_point DOUBLE PRECISION NOT NULL,
    mark_from INTEGER NOT NULL,
    mark_to INTEGER NOT NULL,
    note TEXT,
    CONSTRAINT fk_exam_terms_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_exam_terms_school_id_grade_name
    ON exam_terms (school_id, lower(grade_name));

CREATE INDEX IF NOT EXISTS idx_exam_terms_school_id
    ON exam_terms (school_id);

CREATE INDEX IF NOT EXISTS idx_exam_terms_grade_name
    ON exam_terms (grade_name);
