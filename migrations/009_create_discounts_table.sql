-- +migrate Up
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('TOTAL_FIXED', 'TOTAL_PERCENTAGE', 'ITEM_PERCENTAGE', 'ITEM_FIXED')),
    percentage DECIMAL(5, 2),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    transaction_item_id UUID REFERENCES transaction_items(id)
);

CREATE INDEX idx_discounts_transaction_id ON discounts(transaction_id);
CREATE INDEX idx_discounts_transaction_item_id ON discounts(transaction_item_id);

-- +migrate Down
DROP TABLE IF EXISTS discounts;
