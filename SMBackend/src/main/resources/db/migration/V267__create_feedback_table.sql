CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    feedback TEXT NOT NULL,
    is_publish BOOLEAN DEFAULT FALSE NOT NULL,
    date DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_school_id ON feedbacks (school_id);
