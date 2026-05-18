ALTER TABLE students
    DROP CONSTRAINT IF EXISTS students_admission_no_key,
    DROP CONSTRAINT IF EXISTS students_username_key;

DROP INDEX IF EXISTS students_admission_no_key;
DROP INDEX IF EXISTS students_username_key;

CREATE UNIQUE INDEX IF NOT EXISTS ux_students_admission_no_active
    ON students (admission_no)
    WHERE deleted = false;

CREATE UNIQUE INDEX IF NOT EXISTS ux_students_username_active
    ON students (username)
    WHERE deleted = false;
