CREATE TABLE IF NOT EXISTS subjects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    subject_code VARCHAR(255),
    author VARCHAR(255),
    type VARCHAR(255),
    note TEXT,
    school_id BIGINT,
    class_id BIGINT,
    teacher_id BIGINT,

    CONSTRAINT fk_subjects_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_subjects_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_subjects_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON subjects(teacher_id);
