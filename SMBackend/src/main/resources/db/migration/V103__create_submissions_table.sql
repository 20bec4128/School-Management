CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,

    school_id BIGINT,
    class_id BIGINT,
    section_id BIGINT,
    student_id BIGINT,
    assignment_id BIGINT,

    file_url VARCHAR(1024),

    note VARCHAR(1000),

    evaluate VARCHAR(50),
    marks INTEGER,
    feedback VARCHAR(1000),

    submitted_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_submissions_assignment_student ON submissions(assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_school_id ON submissions(school_id);
CREATE INDEX IF NOT EXISTS idx_submissions_class_section ON submissions(class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
