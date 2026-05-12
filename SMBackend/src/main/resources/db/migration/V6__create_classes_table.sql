CREATE TABLE IF NOT EXISTS classes (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    class_name VARCHAR(255),
    numeric_name VARCHAR(255),
    teacher_id BIGINT,
    note TEXT,

    CONSTRAINT fk_classes_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
