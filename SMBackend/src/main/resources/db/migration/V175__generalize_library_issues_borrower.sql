ALTER TABLE library_issues
    ADD COLUMN IF NOT EXISTS borrower_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS class_id BIGINT,
    ADD COLUMN IF NOT EXISTS class_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS employee_id BIGINT,
    ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS employee_photo TEXT,
    ADD COLUMN IF NOT EXISTS employee_role VARCHAR(255);

ALTER TABLE library_issues
    ALTER COLUMN student_id DROP NOT NULL,
    ALTER COLUMN student_name DROP NOT NULL,
    ALTER COLUMN borrower_type SET DEFAULT 'STUDENT';

ALTER TABLE library_issues
    ADD CONSTRAINT fk_library_issues_class FOREIGN KEY (class_id) REFERENCES classes(id);

ALTER TABLE library_issues
    ADD CONSTRAINT fk_library_issues_employee FOREIGN KEY (employee_id) REFERENCES employees(id);

UPDATE library_issues
SET borrower_type = COALESCE(NULLIF(UPPER(TRIM(borrower_type)), ''), 'STUDENT');

CREATE INDEX IF NOT EXISTS idx_library_issues_borrower_type ON library_issues(borrower_type);
CREATE INDEX IF NOT EXISTS idx_library_issues_class_id ON library_issues(class_id);
CREATE INDEX IF NOT EXISTS idx_library_issues_employee_id ON library_issues(employee_id);
