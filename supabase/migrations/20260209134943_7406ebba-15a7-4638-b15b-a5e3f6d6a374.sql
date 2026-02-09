
-- Add 3-coin system columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS a_coin_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS b_coin_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS b_coin_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS b_coin_last_reset timestamp with time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS p_coin_balance integer NOT NULL DEFAULT 0;

-- Migrate existing coin_balance to a_coin_balance
UPDATE public.profiles SET a_coin_balance = coin_balance WHERE coin_balance > 0;
