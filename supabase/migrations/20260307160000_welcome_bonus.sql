-- Centralized B Coin Management with Automatic Weekly Reset

-- Function to handle reset logic (can be called manually or via trigger)
CREATE OR REPLACE FUNCTION public.check_b_coin_reset(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET b_coin_balance = 0,
      b_coin_last_reset = now()
  WHERE user_id = p_user_id
    AND b_coin_last_reset + INTERVAL '7 days' <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function to auto-reset on any profile update
CREATE OR REPLACE FUNCTION public.trigger_b_coin_reset()
RETURNS TRIGGER AS $$
BEGIN
  -- If 7 days have passed since last reset, reset balance to 0
  IF (OLD.b_coin_last_reset + INTERVAL '7 days' <= now()) THEN
    NEW.b_coin_balance = 0;
    NEW.b_coin_last_reset = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS on_profile_update_check_reset ON public.profiles;
CREATE TRIGGER on_profile_update_check_reset
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_b_coin_reset();

-- Centralized RPC to add B Coins (trigger will handle reset if needed)
CREATE OR REPLACE FUNCTION public.add_b_coins(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    UPDATE public.profiles
    SET b_coin_balance = b_coin_balance + p_amount
    WHERE user_id = p_user_id
    RETURNING b_coin_balance INTO v_new_balance;

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update handle_new_user to give 50 B Coins to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, b_coin_balance, b_coin_last_reset)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    50, -- Welcome bonus
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
