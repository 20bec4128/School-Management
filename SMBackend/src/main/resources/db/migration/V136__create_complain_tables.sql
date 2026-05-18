-- V136__create_complain_tables.sql

CREATE TABLE IF NOT EXISTS complain_types (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    complain_type VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complain_types_school_id ON complain_types (school_id);

CREATE TABLE IF NOT EXISTS complains (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    complain_by VARCHAR(255) NOT NULL,
    complain_type_id BIGINT,
    complain_date DATE NOT NULL,
    action_date DATE,
    complain TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_complains_type FOREIGN KEY (complain_type_id) REFERENCES complain_types(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_complains_school_id ON complains (school_id);
CREATE INDEX IF NOT EXISTS idx_complains_type_id ON complains (complain_type_id);
CREATE INDEX IF NOT EXISTS idx_complains_school_date ON complains (school_id, complain_date);
