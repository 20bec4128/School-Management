CREATE TABLE IF NOT EXISTS fee_types (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    fee_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_fee_types_school_id ON fee_types (school_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_fee_types_school_id_title_fee_type
    ON fee_types (school_id, lower(title), lower(fee_type));
