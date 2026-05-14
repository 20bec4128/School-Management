CREATE TABLE IF NOT EXISTS notices (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    notice_date DATE NOT NULL,
    notice_for VARCHAR(100),
    notice_text TEXT,
    is_view_on_web BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notices_school_id ON notices (school_id);

CREATE TABLE IF NOT EXISTS news (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    news_date DATE NOT NULL,
    image_url TEXT,
    news_text TEXT,
    is_view_on_web BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_school_id ON news (school_id);

CREATE TABLE IF NOT EXISTS holidays (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    note TEXT,
    is_view_on_web BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_holidays_school_id ON holidays (school_id);
