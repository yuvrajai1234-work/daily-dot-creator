-- Add is_locked column to channels table
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- Update policies to respect is_locked if needed, or handled in frontend/API logic
-- For now, just adding the column.
