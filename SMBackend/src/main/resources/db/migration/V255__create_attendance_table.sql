CREATE TABLE attendance (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT,
    school_id BIGINT NOT NULL,
    exam_term VARCHAR(255) NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    section_name VARCHAR(100),
    subject_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    roll_no VARCHAR(100),
    photo_path VARCHAR(500),
    attend_all VARCHAR(50) NOT NULL,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);