-- +migrate Up
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(15, 4) NOT NULL CHECK (quantity > 0),
    unit_quantity_id UUID NOT NULL REFERENCES unit_quantities(id),
    price_per_unit DECIMAL(15, 2) NOT NULL CHECK (price_per_unit >= 0),
    total DECIMAL(15, 2) NOT NULL CHECK (total >= 0),
    remark TEXT
);

CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product_id ON transaction_items(product_id);

-- +migrate Down
DROP TABLE IF EXISTS transaction_items;
