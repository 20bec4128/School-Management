CREATE TABLE IF NOT EXISTS study_materials (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(512),
    file_path VARCHAR(1024),
    file_type VARCHAR(255),

    CONSTRAINT fk_study_materials_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_study_materials_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_study_materials_subject FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE INDEX IF NOT EXISTS idx_study_materials_school_id ON study_materials(school_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_class_id ON study_materials(class_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_subject_id ON study_materials(subject_id);
