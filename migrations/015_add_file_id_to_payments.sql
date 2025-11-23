-- +migrate Up
ALTER TABLE payments ADD COLUMN file_id UUID REFERENCES files(id);
CREATE INDEX idx_payments_file_id ON payments(file_id);

-- +migrate Down
DROP INDEX IF EXISTS idx_payments_file_id;
ALTER TABLE payments DROP COLUMN IF EXISTS file_id;
