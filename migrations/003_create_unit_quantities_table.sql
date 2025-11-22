-- +migrate Up
CREATE TABLE IF NOT EXISTS unit_quantities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    remark TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id)
);

CREATE INDEX idx_unit_quantities_name ON unit_quantities(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_unit_quantities_deleted_at ON unit_quantities(deleted_at);

-- +migrate Down
DROP TABLE IF EXISTS unit_quantities;
