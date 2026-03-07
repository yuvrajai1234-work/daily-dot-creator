-- Add unlocked_rewards column to profiles table to persist reward purchases across devices
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unlocked_rewards integer[] DEFAULT '{}';
