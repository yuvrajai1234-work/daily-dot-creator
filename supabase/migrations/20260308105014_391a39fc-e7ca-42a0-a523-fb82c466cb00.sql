
-- Add missing columns to profiles for the coin/XP system
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS current_xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_xp integer NOT NULL DEFAULT 0;

-- Add sort_order to habits
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Create the add_b_coins function
CREATE OR REPLACE FUNCTION public.add_b_coins(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  UPDATE profiles
  SET b_coin_balance = b_coin_balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING b_coin_balance INTO new_balance;
  
  RETURN new_balance;
END;
$$;
