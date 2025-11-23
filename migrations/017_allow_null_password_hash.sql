-- +migrate Up
-- Allow NULL password_hash for users created by admins
-- They will receive a set password email instead
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add set_password_token column for the set password flow
ALTER TABLE users ADD COLUMN IF NOT EXISTS set_password_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS set_password_expires TIMESTAMP;

CREATE INDEX idx_users_set_password_token ON users(set_password_token) WHERE deleted_at IS NULL;

-- +migrate Down
ALTER TABLE users DROP COLUMN IF EXISTS set_password_expires;
ALTER TABLE users DROP COLUMN IF EXISTS set_password_token;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
