-- Add sort_order column to habits table to allow custom ordering
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Set existing habits with a default sort_order based on created_at
WITH row_numbered AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM public.habits
)
UPDATE public.habits
SET sort_order = row_numbered.rn
FROM row_numbered
WHERE habits.id = row_numbered.id;
