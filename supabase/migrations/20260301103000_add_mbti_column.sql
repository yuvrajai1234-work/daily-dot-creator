-- Add personality_type column to store MBTI type (e.g. ENFJ, INTJ)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_type text;
