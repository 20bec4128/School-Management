CREATE TABLE IF NOT EXISTS assignments (
    id BIGSERIAL PRIMARY KEY,

    school_id BIGINT,
    class_id BIGINT,
    section_id BIGINT,
    subject_id BIGINT,

    title VARCHAR(255),
    assignment_date DATE,
    submission_date DATE,

    assignment_file VARCHAR(1024),

    sms_notification BOOLEAN,
    email_notification BOOLEAN,

    note VARCHAR(1000),
    status VARCHAR(50),

    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignments_class_section ON assignments(class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_school_id ON assignments(school_id);
