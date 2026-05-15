ALTER TABLE warehouses
ADD COLUMN IF NOT EXISTS warehouse_keeper_id BIGINT;

ALTER TABLE warehouses
ADD CONSTRAINT fk_warehouses_warehouse_keeper FOREIGN KEY (warehouse_keeper_id) REFERENCES employees(id);

CREATE INDEX IF NOT EXISTS idx_warehouses_warehouse_keeper_id ON warehouses(warehouse_keeper_id);
