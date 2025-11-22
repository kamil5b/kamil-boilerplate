-- +migrate Up
-- Remove the constraint that prevents negative payment amounts
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_amount_check;

-- +migrate Down
-- Restore the constraint (only if you want to revert)
ALTER TABLE payments ADD CONSTRAINT payments_amount_check CHECK (amount > 0);
