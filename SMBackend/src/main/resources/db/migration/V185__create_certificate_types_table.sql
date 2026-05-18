CREATE TABLE IF NOT EXISTS certificate_types (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    certificate_name VARCHAR(255) NOT NULL,
    school_name_on_card VARCHAR(255),
    certificate_text TEXT,
    footer_left_text VARCHAR(255),
    footer_middle_text VARCHAR(255),
    footer_right_text VARCHAR(255),
    background_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificate_types_head_office_id ON certificate_types (head_office_id);
CREATE INDEX IF NOT EXISTS idx_certificate_types_school_id ON certificate_types (school_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_certificate_types_school_id_certificate_name
    ON certificate_types (school_id, lower(certificate_name));
