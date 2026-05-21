CREATE TABLE IF NOT EXISTS frontend_pages (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT,
    school_id BIGINT NOT NULL,
    school_name VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    url_slug VARCHAR(255) NOT NULL,
    description TEXT,
    image TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_frontend_pages_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT uq_frontend_pages_school_slug UNIQUE (school_id, url_slug)
);

CREATE INDEX IF NOT EXISTS idx_frontend_pages_head_office ON frontend_pages (head_office_id);
CREATE INDEX IF NOT EXISTS idx_frontend_pages_school ON frontend_pages (school_id);
CREATE INDEX IF NOT EXISTS idx_frontend_pages_url_slug ON frontend_pages (url_slug);
