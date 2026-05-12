CREATE TABLE student_activities (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    class_name VARCHAR(20) NOT NULL,
    section VARCHAR(10) NOT NULL,
    activity_date DATE NOT NULL,
    activity_name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_student_activity_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_student_activity_student FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX idx_student_activity_school ON student_activities(school_id);
CREATE INDEX idx_student_activity_student ON student_activities(student_id);
CREATE INDEX idx_student_activity_date ON student_activities(activity_date);
CREATE INDEX idx_student_activity_class_section ON student_activities(class_name, section);
CREATE INDEX idx_student_activity_deleted ON student_activities(deleted);
