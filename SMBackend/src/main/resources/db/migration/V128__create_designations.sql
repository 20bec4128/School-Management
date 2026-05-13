CREATE TABLE IF NOT EXISTS designations (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_designations_school_id ON designations (school_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_designations_school_id_name
    ON designations (school_id, lower(name));
