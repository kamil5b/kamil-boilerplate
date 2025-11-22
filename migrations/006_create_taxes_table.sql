-- +migrate Up
CREATE TABLE IF NOT EXISTS taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    value DECIMAL(10, 4) NOT NULL,
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id)
);

CREATE INDEX idx_taxes_name ON taxes(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_taxes_deleted_at ON taxes(deleted_at);

-- +migrate Down
DROP TABLE IF EXISTS taxes;
