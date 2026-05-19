CREATE TABLE IF NOT EXISTS salary_payments (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    school_name VARCHAR(255),
    employee_id BIGINT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    salary_grade_id BIGINT,
    grade_name VARCHAR(255),
    salary_type VARCHAR(60),
    month VARCHAR(100) NOT NULL,
    payment_date DATE,
    payment_method VARCHAR(100) NOT NULL,
    basic_salary DOUBLE PRECISION,
    total_allowance DOUBLE PRECISION,
    total_deduction DOUBLE PRECISION,
    gross_salary DOUBLE PRECISION,
    net_salary DOUBLE PRECISION,
    status VARCHAR(50),
    note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_salary_payments_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_salary_payments_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_salary_payments_salary_grade FOREIGN KEY (salary_grade_id) REFERENCES salary_grades(id)
);

CREATE INDEX IF NOT EXISTS idx_salary_payments_school ON salary_payments (school_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_employee ON salary_payments (employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_salary_grade ON salary_payments (salary_grade_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_month ON salary_payments (month);
CREATE INDEX IF NOT EXISTS idx_salary_payments_status ON salary_payments (status);
