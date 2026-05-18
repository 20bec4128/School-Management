CREATE TABLE IF NOT EXISTS leave_types (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    designation_id BIGINT,
    applicant_type VARCHAR(50) NOT NULL,
    leave_type VARCHAR(255) NOT NULL,
    allowed_leaves_per_year INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leave_types_school_id ON leave_types (school_id);
CREATE INDEX IF NOT EXISTS idx_leave_types_designation_id ON leave_types (designation_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_leave_types_school_applicant_designation_leave
    ON leave_types (school_id, applicant_type, COALESCE(designation_id, -1), lower(leave_type));
