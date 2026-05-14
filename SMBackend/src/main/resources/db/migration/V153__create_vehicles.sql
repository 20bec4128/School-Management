CREATE TABLE IF NOT EXISTS vehicles (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL REFERENCES schools(id),
    driver_employee_id BIGINT NOT NULL REFERENCES employees(id),
    vehicle_number VARCHAR(255) NOT NULL,
    vehicle_model VARCHAR(255),
    vehicle_license VARCHAR(255),
    vehicle_contact_country_code VARCHAR(20) NOT NULL,
    vehicle_contact_number VARCHAR(50) NOT NULL,
    note TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_vehicles_school_id ON vehicles(school_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_employee_id ON vehicles(driver_employee_id);
