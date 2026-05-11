CREATE TABLE IF NOT EXISTS sections (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    name VARCHAR(255),
    teacher_id BIGINT,
    note TEXT,

    CONSTRAINT fk_sections_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_sections_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_sections_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE INDEX IF NOT EXISTS idx_sections_school_id ON sections(school_id);
CREATE INDEX IF NOT EXISTS idx_sections_class_id ON sections(class_id);
CREATE INDEX IF NOT EXISTS idx_sections_teacher_id ON sections(teacher_id);
