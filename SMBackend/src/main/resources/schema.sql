ALTER TABLE IF EXISTS public.schools
ALTER COLUMN registration_date TYPE DATE
USING (
    CASE
        WHEN registration_date IS NULL THEN NULL
        WHEN btrim(registration_date::text) = '' THEN NULL
        WHEN registration_date::text ~ '^\d{4}-\d{2}-\d{2}$' THEN registration_date::date
        WHEN registration_date::text ~ '^\d{2}/\d{2}/\d{4}$' THEN to_date(registration_date::text, 'DD/MM/YYYY')
        WHEN registration_date::text ~ '^\d{2}-\d{2}-\d{4}$' THEN to_date(registration_date::text, 'DD-MM-YYYY')
        ELSE NULL
    END
);

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

CREATE TABLE IF NOT EXISTS discounts (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    discount_type VARCHAR(50) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    note TEXT
);

CREATE INDEX IF NOT EXISTS idx_discounts_school_id ON discounts (school_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_discounts_school_id_title
    ON discounts (school_id, lower(title));

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
