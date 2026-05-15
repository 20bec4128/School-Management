CREATE TABLE purchases (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    supplier_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    purchase_by_id BIGINT NOT NULL,
    purchase_by_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(18,3) NOT NULL,
    unit_type VARCHAR(50) NOT NULL,
    custom_unit_type VARCHAR(255),
    unit_price NUMERIC(18,2) NOT NULL,
    purchase_date DATE NOT NULL,
    expire_date DATE,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchases_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id),
    CONSTRAINT fk_purchases_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_purchases_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_purchases_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_purchases_purchase_by FOREIGN KEY (purchase_by_id) REFERENCES employees(id)
);

CREATE INDEX idx_purchases_head_office_id ON purchases(head_office_id);
CREATE INDEX idx_purchases_school_id ON purchases(school_id);
CREATE INDEX idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX idx_purchases_category_id ON purchases(category_id);
CREATE INDEX idx_purchases_product_id ON purchases(product_id);
CREATE INDEX idx_purchases_purchase_by_id ON purchases(purchase_by_id);
