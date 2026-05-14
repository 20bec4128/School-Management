-- V135__create_front_office_tables.sql

-- 1. Visitor Purposes
CREATE TABLE IF NOT EXISTS visitor_purposes (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vp_school ON visitor_purposes (school_id);

-- 2. Visitor Infos
CREATE TABLE IF NOT EXISTS visitor_infos (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    purpose_id BIGINT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    coming_from VARCHAR(255),
    id_card VARCHAR(100),
    num_of_person INT DEFAULT 1,
    date DATE NOT NULL,
    in_time TIME,
    out_time TIME,
    note TEXT,
    file_path VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_visitor_infos_purpose FOREIGN KEY (purpose_id) REFERENCES visitor_purposes(id)
);

CREATE INDEX IF NOT EXISTS idx_vi_school ON visitor_infos (school_id);
CREATE INDEX IF NOT EXISTS idx_vi_purpose_id ON visitor_infos (purpose_id);

-- 3. Call Logs
CREATE TABLE IF NOT EXISTS call_logs (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    date DATE NOT NULL,
    follow_up_date DATE,
    call_duration VARCHAR(50),
    call_type VARCHAR(20), -- Incoming, Outgoing
    note TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cl_school ON call_logs (school_id);

-- 4. Postal Dispatches
CREATE TABLE IF NOT EXISTS postal_dispatches (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    to_title VARCHAR(255) NOT NULL,
    reference_no VARCHAR(100),
    address TEXT,
    from_title VARCHAR(255),
    date DATE NOT NULL,
    note TEXT,
    file_path VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pd_school ON postal_dispatches (school_id);

-- 5. Postal Receives
CREATE TABLE IF NOT EXISTS postal_receives (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    from_title VARCHAR(255) NOT NULL,
    reference_no VARCHAR(100),
    address TEXT,
    to_title VARCHAR(255),
    date DATE NOT NULL,
    note TEXT,
    file_path VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pr_school ON postal_receives (school_id);
