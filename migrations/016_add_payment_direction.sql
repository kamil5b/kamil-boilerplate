-- +migrate Up
-- Add direction column to payments table
ALTER TABLE payments ADD COLUMN direction VARCHAR(10);

-- Migrate existing data: negative amounts -> OUTFLOW, positive/zero amounts -> INFLOW
UPDATE payments SET direction = 'OUTFLOW' WHERE amount < 0;
UPDATE payments SET direction = 'INFLOW' WHERE amount >= 0;

-- Convert all amounts to positive (absolute values)
UPDATE payments SET amount = ABS(amount);

-- Make direction NOT NULL now that data is migrated
ALTER TABLE payments ALTER COLUMN direction SET NOT NULL;

-- Add constraint to ensure only valid directions
ALTER TABLE payments ADD CONSTRAINT payments_direction_check CHECK (direction IN ('INFLOW', 'OUTFLOW'));

-- Add index for better query performance
CREATE INDEX idx_payments_direction ON payments(direction);

-- +migrate Down
DROP INDEX IF EXISTS idx_payments_direction;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_direction_check;
ALTER TABLE payments DROP COLUMN IF EXISTS direction;
