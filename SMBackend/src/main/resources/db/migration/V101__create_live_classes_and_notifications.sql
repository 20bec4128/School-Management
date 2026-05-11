CREATE TABLE IF NOT EXISTS live_classes (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    live_class_type VARCHAR(255) NOT NULL,
    meeting_link VARCHAR(1024),
    class_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    note TEXT,
    status VARCHAR(100) NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_live_classes_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_live_classes_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_live_classes_section FOREIGN KEY (section_id) REFERENCES sections(id),
    CONSTRAINT fk_live_classes_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
    CONSTRAINT fk_live_classes_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE INDEX IF NOT EXISTS idx_live_classes_teacher_schedule ON live_classes(teacher_id, class_date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_live_classes_class_section_schedule ON live_classes(class_id, section_id, class_date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_live_classes_student_lookup ON live_classes(class_id, section_id);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    reference_id BIGINT,
    student_id BIGINT,
    target_role VARCHAR(100) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_student FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_student_read ON notifications(student_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(type, reference_id);
