CREATE TABLE IF NOT EXISTS library_issues (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    book_title VARCHAR(255) NOT NULL,
    book_cover TEXT,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_photo TEXT,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED',
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_library_issues_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id),
    CONSTRAINT fk_library_issues_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_library_issues_student FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX IF NOT EXISTS idx_library_issues_head_office_id ON library_issues(head_office_id);
CREATE INDEX IF NOT EXISTS idx_library_issues_school_id ON library_issues(school_id);
CREATE INDEX IF NOT EXISTS idx_library_issues_book_id ON library_issues(book_id);
CREATE INDEX IF NOT EXISTS idx_library_issues_student_id ON library_issues(student_id);
CREATE INDEX IF NOT EXISTS idx_library_issues_status ON library_issues(status);
