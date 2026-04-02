-- Add product status column
-- Allows products to be marked as: active, draft, coming_soon, or archived

ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'coming_soon', 'archived'));

-- Update existing products to 'active' status (if they have null)
UPDATE products SET status = 'active' WHERE status IS NULL;

-- Make status NOT NULL after ensuring all rows have a value
ALTER TABLE products ALTER COLUMN status SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN products.status IS 'Product status: active (available for purchase), draft (hidden), coming_soon (visible but not purchasable), archived (hidden from all views)';
