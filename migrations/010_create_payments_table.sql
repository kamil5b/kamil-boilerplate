-- +migrate Up
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('CASH', 'PAPER', 'CARD', 'QRIS', 'TRANSFER')),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_type ON payments(type);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- +migrate Down
DROP TABLE IF EXISTS payments;
