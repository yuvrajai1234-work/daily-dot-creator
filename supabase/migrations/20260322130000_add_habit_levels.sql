-- Add level descriptions to habits table
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS level1_description text,
ADD COLUMN IF NOT EXISTS level2_description text,
ADD COLUMN IF NOT EXISTS level3_description text,
ADD COLUMN IF NOT EXISTS level4_description text;

-- Add comment for documentation
COMMENT ON COLUMN public.habits.level1_description IS 'Custom description for effort level 1';
COMMENT ON COLUMN public.habits.level2_description IS 'Custom description for effort level 2';
COMMENT ON COLUMN public.habits.level3_description IS 'Custom description for effort level 3';
COMMENT ON COLUMN public.habits.level4_description IS 'Custom description for effort level 4';
