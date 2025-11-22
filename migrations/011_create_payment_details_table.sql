-- +migrate Up
CREATE TABLE IF NOT EXISTS payment_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    identifier VARCHAR(255) NOT NULL,
    value TEXT NOT NULL
);

CREATE INDEX idx_payment_details_payment_id ON payment_details(payment_id);

-- +migrate Down
DROP TABLE IF EXISTS payment_details;
