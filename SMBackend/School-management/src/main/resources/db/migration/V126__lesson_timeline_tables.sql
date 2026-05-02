-- ============================================================
--  V126 : Lesson timeline tables
--         - lesson_timeline (one row per lesson)
--         - topic_timeline  (one row per topic)
--         - backfill from lesson_plan_entries (if present)
-- ============================================================

CREATE TABLE IF NOT EXISTS lesson_timeline (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL UNIQUE,
    start_date DATE,
    end_date DATE,

    CONSTRAINT fk_lesson_timeline_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lesson_timeline_lesson_id ON lesson_timeline(lesson_id);

CREATE TABLE IF NOT EXISTS topic_timeline (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL UNIQUE,
    start_date DATE,
    end_date DATE,

    CONSTRAINT fk_topic_timeline_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_topic_timeline_topic_id ON topic_timeline(topic_id);

-- Best-effort backfill from legacy lesson_plan_entries table.
-- This keeps existing data visible after the timeline refactor.
INSERT INTO lesson_timeline (lesson_id, start_date, end_date)
SELECT e.lesson_id, MAX(e.lesson_start_date), MAX(e.lesson_end_date)
FROM lesson_plan_entries e
WHERE e.lesson_id IS NOT NULL
GROUP BY e.lesson_id
ON CONFLICT (lesson_id) DO NOTHING;

INSERT INTO topic_timeline (topic_id, start_date, end_date)
SELECT e.topic_id, MAX(e.topic_start_date), MAX(e.topic_end_date)
FROM lesson_plan_entries e
WHERE e.topic_id IS NOT NULL
GROUP BY e.topic_id
ON CONFLICT (topic_id) DO NOTHING;

