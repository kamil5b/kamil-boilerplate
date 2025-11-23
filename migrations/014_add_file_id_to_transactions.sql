-- +migrate Up
ALTER TABLE transactions ADD COLUMN file_id UUID REFERENCES files(id);
CREATE INDEX idx_transactions_file_id ON transactions(file_id);

-- +migrate Down
DROP INDEX IF EXISTS idx_transactions_file_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS file_id;
