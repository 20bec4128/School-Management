-- ============================================================
--  V122 : Lesson plan module tables
--         - lessons
--         - topics
--         - lesson_plan_entries
-- ============================================================

CREATE TABLE IF NOT EXISTS lessons (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    school_name VARCHAR(255),
    academic_year VARCHAR(50) NOT NULL,
    class_id BIGINT NOT NULL,
    class_name VARCHAR(255),
    subject_id BIGINT NOT NULL,
    subject_name VARCHAR(255),
    lesson VARCHAR(255) NOT NULL,
    note TEXT,

    CONSTRAINT fk_lessons_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_lessons_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_lessons_subject FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE INDEX IF NOT EXISTS idx_lessons_school_id ON lessons(school_id);
CREATE INDEX IF NOT EXISTS idx_lessons_school_id_academic_year ON lessons(school_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_lessons_school_year_class_subject ON lessons(school_id, academic_year, class_id, subject_id);

CREATE TABLE IF NOT EXISTS topics (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    class_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    lesson_id BIGINT NOT NULL,
    topic VARCHAR(255) NOT NULL,
    note TEXT,

    CONSTRAINT fk_topics_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_topics_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_topics_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
    CONSTRAINT fk_topics_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_topics_lesson_id ON topics(lesson_id);
CREATE INDEX IF NOT EXISTS idx_topics_school_year_class_subject ON topics(school_id, academic_year, class_id, subject_id);

CREATE TABLE IF NOT EXISTS lesson_plan_entries (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    class_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    lesson_id BIGINT NOT NULL,
    topic_id BIGINT,

    lesson_start_date DATE,
    lesson_end_date DATE,
    lesson_status VARCHAR(30),

    topic_start_date DATE,
    topic_end_date DATE,
    topic_status VARCHAR(30),

    CONSTRAINT fk_lesson_plan_entries_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_lesson_plan_entries_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_lesson_plan_entries_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
    CONSTRAINT fk_lesson_plan_entries_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    CONSTRAINT fk_lesson_plan_entries_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lesson_plan_entries_scope ON lesson_plan_entries(school_id, academic_year, class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_entries_lesson_id ON lesson_plan_entries(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_entries_topic_id ON lesson_plan_entries(topic_id);

