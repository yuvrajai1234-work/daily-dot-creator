-- =============================================
-- XP and Leveling System
-- =============================================

-- Add XP and Level columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_xp INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0;

-- Create XP transactions table to track all XP gains
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  activity_type TEXT NOT NULL, -- 'habit_log', 'journal', 'claim_reward', 'achievement', 'community', 'premium', 'ebook'
  activity_id TEXT, -- Reference to the specific activity
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON public.xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON public.xp_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for XP transactions
CREATE POLICY "Users can view own XP transactions" ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own XP transactions" ON public.xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to calculate XP required for a level (geometric progression)
-- Formula: XP_required = 100 * (1.058)^(level - 1)
-- This creates a progression where level 100 requires ~146,000 total XP
CREATE OR REPLACE FUNCTION calculate_xp_for_level(target_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Base XP for level 1 is 100, with 1.058 multiplier
  RETURN FLOOR(100 * POWER(1.058, target_level - 1));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate total XP needed to reach a level
CREATE OR REPLACE FUNCTION calculate_total_xp_for_level(target_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER := 0;
  i INTEGER;
BEGIN
  FOR i IN 1..target_level LOOP
    total := total + calculate_xp_for_level(i);
  END LOOP;
  RETURN total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to add XP and auto-level up
CREATE OR REPLACE FUNCTION add_xp_to_user(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_activity_type TEXT,
  p_activity_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(new_level INTEGER, level_up BOOLEAN, xp_gained INTEGER) AS $$
DECLARE
  current_profile RECORD;
  new_xp INTEGER;
  new_total_xp INTEGER;
  new_level_val INTEGER;
  xp_needed INTEGER;
  leveled_up BOOLEAN := false;
BEGIN
  -- Get current profile data
  SELECT level, current_xp, total_xp INTO current_profile
  FROM public.profiles
  WHERE user_id = p_user_id;

  -- Calculate new XP values
  new_xp := current_profile.current_xp + p_xp_amount;
  new_total_xp := current_profile.total_xp + p_xp_amount;
  new_level_val := current_profile.level;

  -- Check for level up (can level up multiple times)
  LOOP
    xp_needed := calculate_xp_for_level(new_level_val);
    
    IF new_xp >= xp_needed THEN
      new_xp := new_xp - xp_needed;
      new_level_val := new_level_val + 1;
      leveled_up := true;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Update profile
  UPDATE public.profiles
  SET 
    level = new_level_val,
    current_xp = new_xp,
    total_xp = new_total_xp
  WHERE user_id = p_user_id;

  -- Insert XP transaction
  INSERT INTO public.xp_transactions (user_id, xp_amount, activity_type, activity_id, description)
  VALUES (p_user_id, p_xp_amount, p_activity_type, p_activity_id, p_description);

  -- Return results
  RETURN QUERY SELECT new_level_val, leveled_up, p_xp_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for level leaderboard
CREATE OR REPLACE VIEW public.level_leaderboard AS
SELECT 
  p.user_id,
  p.full_name,
  p.avatar_url,
  p.level,
  p.total_xp,
  RANK() OVER (ORDER BY p.level DESC, p.total_xp DESC) as rank
FROM public.profiles p
ORDER BY p.level DESC, p.total_xp DESC
LIMIT 100;

-- Grant access to the view
GRANT SELECT ON public.level_leaderboard TO authenticated;

-- Comment on the system
COMMENT ON TABLE public.xp_transactions IS 'Tracks all XP gains from various activities';
COMMENT ON FUNCTION calculate_xp_for_level IS 'Calculates XP required for a specific level using geometric progression (1.058 ratio)';
COMMENT ON FUNCTION add_xp_to_user IS 'Adds XP to user and automatically handles level ups';
