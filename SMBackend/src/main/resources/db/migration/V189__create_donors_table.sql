CREATE TABLE donors (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id),
    academic_year VARCHAR(20),
    donor_type VARCHAR(60) NOT NULL,
    donor_name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(200),
    email VARCHAR(200),
    phone VARCHAR(40),
    amount NUMERIC(12,2) NOT NULL,
    address TEXT,
    note TEXT
);

CREATE INDEX idx_donors_school_id ON donors (school_id);
CREATE INDEX idx_donors_academic_year ON donors (academic_year);
CREATE INDEX idx_donors_donor_type ON donors (donor_type);
