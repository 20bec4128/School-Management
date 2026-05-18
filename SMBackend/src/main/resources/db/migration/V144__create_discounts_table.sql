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
