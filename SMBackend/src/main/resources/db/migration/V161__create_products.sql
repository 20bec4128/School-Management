CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id),
    CONSTRAINT fk_products_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_products_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE INDEX IF NOT EXISTS idx_products_head_office_id ON products(head_office_id);
CREATE INDEX IF NOT EXISTS idx_products_school_id ON products(school_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_warehouse_id ON products(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_products_product_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
