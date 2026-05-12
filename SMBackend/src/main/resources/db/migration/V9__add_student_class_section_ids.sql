ALTER TABLE students
    ADD COLUMN IF NOT EXISTS class_id BIGINT,
    ADD COLUMN IF NOT EXISTS section_id BIGINT;

UPDATE students s
SET class_id = c.id
FROM classes c
WHERE s.class_id IS NULL
  AND s.school_id = c.school_id
  AND (
    s.class_name = c.class_name
    OR s.class_name = c.numeric_name
  );

UPDATE students s
SET section_id = sec.id
FROM sections sec
LEFT JOIN classes c ON c.id = sec.class_id
WHERE s.section_id IS NULL
  AND s.school_id = sec.school_id
  AND s.section = sec.name
  AND (
    s.class_id = sec.class_id
    OR (
      s.class_id IS NULL
      AND c.id IS NOT NULL
      AND s.school_id = c.school_id
      AND (
        s.class_name = c.class_name
        OR s.class_name = c.numeric_name
      )
    )
  );

ALTER TABLE students
    ADD CONSTRAINT fk_student_class FOREIGN KEY (class_id) REFERENCES classes (id),
    ADD CONSTRAINT fk_student_section FOREIGN KEY (section_id) REFERENCES sections (id);

CREATE INDEX IF NOT EXISTS idx_students_class_id ON students (class_id);
CREATE INDEX IF NOT EXISTS idx_students_section_id ON students (section_id);
