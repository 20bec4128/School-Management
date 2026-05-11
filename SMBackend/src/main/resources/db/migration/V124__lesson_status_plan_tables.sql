-- ============================================================
--  V124 : Lesson status management tables
--         - lesson_plan (one row per lesson)
--         - topic_plan  (one row per topic)
-- ============================================================

CREATE TABLE IF NOT EXISTS lesson_plan (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL UNIQUE,
    lesson_status VARCHAR(30) NOT NULL DEFAULT 'YET_TO_START',

    CONSTRAINT fk_lesson_plan_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lesson_plan_lesson_id ON lesson_plan(lesson_id);

CREATE TABLE IF NOT EXISTS topic_plan (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL UNIQUE,
    topic_status VARCHAR(30) NOT NULL DEFAULT 'YET_TO_START',

    CONSTRAINT fk_topic_plan_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_topic_plan_topic_id ON topic_plan(topic_id);

