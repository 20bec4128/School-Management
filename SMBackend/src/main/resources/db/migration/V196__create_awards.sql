CREATE TABLE IF NOT EXISTS awards (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT,
    school_id BIGINT NOT NULL,
    school_name VARCHAR(255),
    user_type VARCHAR(80) NOT NULL,
    winner_id BIGINT,
    winner_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    gift VARCHAR(255),
    price DOUBLE PRECISION,
    award_date DATE,
    note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_awards_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_awards_head_office ON awards (head_office_id);
CREATE INDEX IF NOT EXISTS idx_awards_school ON awards (school_id);
CREATE INDEX IF NOT EXISTS idx_awards_user_type ON awards (user_type);
CREATE INDEX IF NOT EXISTS idx_awards_award_date ON awards (award_date);
