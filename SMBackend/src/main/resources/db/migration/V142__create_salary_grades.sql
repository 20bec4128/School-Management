CREATE TABLE IF NOT EXISTS salary_grades (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    grade_name VARCHAR(255) NOT NULL,
    basic_salary DOUBLE PRECISION,
    house_rent DOUBLE PRECISION,
    transport_allowance DOUBLE PRECISION,
    medical_allowance DOUBLE PRECISION,
    over_time_hourly_rate DOUBLE PRECISION,
    provident_fund DOUBLE PRECISION,
    hourly_rate DOUBLE PRECISION,
    total_allowance DOUBLE PRECISION,
    total_deduction DOUBLE PRECISION,
    gross_salary DOUBLE PRECISION,
    net_salary DOUBLE PRECISION,
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_salary_grades_school_id ON salary_grades (school_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_salary_grades_school_id_grade_name
    ON salary_grades (school_id, lower(grade_name));
