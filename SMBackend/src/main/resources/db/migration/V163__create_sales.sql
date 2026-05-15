CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    user_type VARCHAR(100) NOT NULL,
    sale_to_id BIGINT NOT NULL,
    sale_to_name VARCHAR(255) NOT NULL,
    income_head_id BIGINT NOT NULL,
    income_head_name VARCHAR(255) NOT NULL,
    sale_date DATE NOT NULL,
    gross_amount NUMERIC(18,2) NOT NULL,
    discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(18,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PAID',
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sales_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id),
    CONSTRAINT fk_sales_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_sales_income_head FOREIGN KEY (income_head_id) REFERENCES income_heads(id)
);

CREATE INDEX idx_sales_head_office_id ON sales(head_office_id);
CREATE INDEX idx_sales_school_id ON sales(school_id);
CREATE INDEX idx_sales_income_head_id ON sales(income_head_id);
CREATE INDEX idx_sales_invoice_number ON sales(invoice_number);
