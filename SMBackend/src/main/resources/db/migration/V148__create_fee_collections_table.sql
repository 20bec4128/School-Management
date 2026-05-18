CREATE TABLE fee_collections (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    class_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    fee_type_id BIGINT NOT NULL,
    fee_amount DOUBLE PRECISION NOT NULL,
    month VARCHAR(100) NOT NULL,
    is_applicable_discount BOOLEAN,
    paid_status VARCHAR(50),
    note TEXT,
    invoice_number VARCHAR(100) UNIQUE,
    gross_amount DOUBLE PRECISION,
    discount DOUBLE PRECISION,
    net_amount DOUBLE PRECISION,
    due_amount DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_fee_collection_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_fee_collection_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_fee_collection_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_fee_collection_fee_type FOREIGN KEY (fee_type_id) REFERENCES fee_types(id)
);

CREATE INDEX idx_fee_collection_school ON fee_collections(school_id);
CREATE INDEX idx_fee_collection_invoice ON fee_collections(invoice_number);
