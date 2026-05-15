CREATE TABLE sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity NUMERIC(18,3) NOT NULL,
    unit_price NUMERIC(18,2) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    CONSTRAINT fk_sale_items_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
