ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pinned_badges text[] DEFAULT '{}';
