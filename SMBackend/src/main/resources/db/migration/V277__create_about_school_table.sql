CREATE TABLE IF NOT EXISTS about_schools (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT,
    school_id BIGINT NOT NULL,
    school_name VARCHAR(255),
    about_text TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_about_schools_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_about_schools_school_active
    ON about_schools (school_id)
    WHERE deleted = false;

CREATE INDEX IF NOT EXISTS idx_about_schools_head_office ON about_schools (head_office_id);
CREATE INDEX IF NOT EXISTS idx_about_schools_school ON about_schools (school_id);
