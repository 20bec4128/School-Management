CREATE TABLE candidates (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id),
    class_id BIGINT NOT NULL REFERENCES classes(id),
    section_id BIGINT NOT NULL REFERENCES sections(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    academic_year VARCHAR(20) NOT NULL,
    note TEXT
);

CREATE UNIQUE INDEX uk_candidate_school_class_section_student_year
    ON candidates (school_id, class_id, section_id, student_id, academic_year);

CREATE INDEX idx_candidates_school_id ON candidates (school_id);
CREATE INDEX idx_candidates_class_id ON candidates (class_id);
CREATE INDEX idx_candidates_section_id ON candidates (section_id);
CREATE INDEX idx_candidates_student_id ON candidates (student_id);
