-- Add order column to categories table for drag-and-drop reordering
-- This column determines the display order of categories on the landing page

-- Add the order column
ALTER TABLE categories ADD COLUMN IF NOT EXISTS order INTEGER DEFAULT 0;

-- Backfill order values based on creation date (oldest first)
-- This provides a deterministic initial order for existing categories
UPDATE categories
SET order = sub.rn - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM categories
) AS sub
WHERE categories.id = sub.id;

-- Add a comment for documentation
COMMENT ON COLUMN categories.order IS 'Display order for categories on the landing page (lower numbers appear first)';
