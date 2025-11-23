-- +migrate Up
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    storage_type VARCHAR(50) NOT NULL CHECK (storage_type IN ('S3', 'LOCAL')),
    storage_path TEXT NOT NULL,
    s3_bucket VARCHAR(255),
    s3_key TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_files_created_by ON files(created_by);
CREATE INDEX idx_files_storage_type ON files(storage_type);

-- +migrate Down
DROP TABLE IF EXISTS files;
