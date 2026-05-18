CREATE TABLE IF NOT EXISTS class_lectures (
    id BIGSERIAL PRIMARY KEY,
    school VARCHAR(255),
    title VARCHAR(255),
    class_name VARCHAR(50),
    section VARCHAR(20),
    subject VARCHAR(255),
    class_lecture VARCHAR(255),
    academic_year VARCHAR(50),
    lecture_url VARCHAR(500),
    note TEXT,
    lesson_id BIGINT,
    teacher_id BIGINT NOT NULL,

    CONSTRAINT fk_class_lectures_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE INDEX IF NOT EXISTS idx_class_lectures_lesson_id ON class_lectures(lesson_id);
CREATE INDEX IF NOT EXISTS idx_class_lectures_teacher_id ON class_lectures(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_lectures_class_section ON class_lectures(class_name, section);
