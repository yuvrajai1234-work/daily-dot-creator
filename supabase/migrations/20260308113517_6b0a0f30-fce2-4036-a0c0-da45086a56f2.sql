CREATE OR REPLACE FUNCTION public.credit_p_coins(p_user_id uuid, p_amount integer, p_period_end timestamp with time zone)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_credited timestamp with time zone;
BEGIN
  SELECT p_coin_last_credited_period_end INTO last_credited
  FROM profiles WHERE user_id = p_user_id;

  IF last_credited IS NOT NULL AND last_credited = p_period_end THEN
    RETURN false;
  END IF;

  UPDATE profiles
  SET p_coin_balance = p_coin_balance + p_amount,
      p_coin_last_credited_period_end = p_period_end,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;