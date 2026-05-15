CREATE TABLE IF NOT EXISTS warehouses (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    warehouse_name VARCHAR(255) NOT NULL,
    warehouse_keeper VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    address TEXT,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_warehouses_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id),
    CONSTRAINT fk_warehouses_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_warehouses_head_office_id ON warehouses(head_office_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_school_id ON warehouses(school_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_warehouse_name ON warehouses(warehouse_name);
