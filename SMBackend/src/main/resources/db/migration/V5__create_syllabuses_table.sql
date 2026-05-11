CREATE TABLE syllabuses (
    id           BIGSERIAL PRIMARY KEY,
    school_id    BIGINT NOT NULL,
    class_id     BIGINT NOT NULL,
    subject_id   BIGINT NOT NULL,
    title        VARCHAR(255) NOT NULL,
    session_year VARCHAR(50),
    file_name    VARCHAR(500),
    file_type    VARCHAR(100),
    file_path    TEXT,
    note         TEXT,

    CONSTRAINT fk_syllabus_school
        FOREIGN KEY (school_id) REFERENCES schools (id),
    CONSTRAINT fk_syllabus_class
        FOREIGN KEY (class_id) REFERENCES classes (id),
    CONSTRAINT fk_syllabus_subject
        FOREIGN KEY (subject_id) REFERENCES subjects (id)
);

CREATE INDEX idx_syllabuses_school_id ON syllabuses (school_id);
CREATE INDEX idx_syllabuses_class_id ON syllabuses (class_id);
CREATE INDEX idx_syllabuses_subject_id ON syllabuses (subject_id);
