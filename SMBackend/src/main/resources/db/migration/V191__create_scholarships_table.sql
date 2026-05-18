CREATE TABLE scholarships (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id),
    class_id BIGINT NOT NULL REFERENCES classes(id),
    section_id BIGINT NOT NULL REFERENCES sections(id),
    student_id BIGINT NOT NULL REFERENCES students(id),
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    note TEXT
);

CREATE INDEX idx_scholarships_school_id ON scholarships (school_id);
CREATE INDEX idx_scholarships_class_id ON scholarships (class_id);
CREATE INDEX idx_scholarships_section_id ON scholarships (section_id);
CREATE INDEX idx_scholarships_student_id ON scholarships (student_id);
CREATE INDEX idx_scholarships_payment_date ON scholarships (payment_date);
