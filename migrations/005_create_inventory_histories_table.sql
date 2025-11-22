-- +migrate Up
CREATE TABLE IF NOT EXISTS inventory_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(15, 4) NOT NULL,
    unit_quantity_id UUID NOT NULL REFERENCES unit_quantities(id),
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_inventory_histories_product_id ON inventory_histories(product_id);
CREATE INDEX idx_inventory_histories_created_at ON inventory_histories(created_at);
CREATE INDEX idx_inventory_histories_unit_quantity_id ON inventory_histories(unit_quantity_id);

-- +migrate Down
DROP TABLE IF EXISTS inventory_histories;
