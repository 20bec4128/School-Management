CREATE TABLE IF NOT EXISTS hostels (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    hostel_type VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_hostels_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_hostels_head_office_id ON hostels(head_office_id);
CREATE INDEX IF NOT EXISTS idx_hostels_school_id ON hostels(school_id);
CREATE INDEX IF NOT EXISTS idx_hostels_hostel_type ON hostels(hostel_type);
