ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_seen_onboarding boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pinned_badges jsonb DEFAULT '[]'::jsonb;