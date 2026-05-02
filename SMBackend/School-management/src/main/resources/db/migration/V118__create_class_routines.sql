CREATE TABLE IF NOT EXISTS class_routines (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    section_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    day VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_no VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_class_routines_school ON class_routines(school_id);
CREATE INDEX IF NOT EXISTS idx_class_routines_class_section ON class_routines(class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_class_routines_teacher_day ON class_routines(teacher_id, day);

