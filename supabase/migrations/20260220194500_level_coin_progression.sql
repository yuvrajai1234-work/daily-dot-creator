-- Update add_xp_to_user to use geometric progression for bonuses
CREATE OR REPLACE FUNCTION add_xp_to_user(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_activity_type TEXT,
  p_activity_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(new_level INTEGER, level_up BOOLEAN, xp_gained INTEGER, bonus_a_coins INTEGER, bonus_b_coins INTEGER) AS $$
DECLARE
  current_profile RECORD;
  new_xp INTEGER;
  new_total_xp INTEGER;
  new_level_val INTEGER;
  xp_needed INTEGER;
  leveled_up BOOLEAN := false;
  v_bonus_a_coins INTEGER := 0;
  v_bonus_b_coins INTEGER := 0;
  level_a_coins INTEGER := 0;
  level_b_coins INTEGER := 0;
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
      
      -- Calculate bonuses per level using progression
      -- B = 9 + L(L+1)/2 => L=1:10, L=2:12, L=3:15, L=4:19...
      level_b_coins := 9 + (new_level_val * (new_level_val + 1) / 2);
      level_a_coins := ROUND(level_b_coins / 2.0);
      
      v_bonus_b_coins := v_bonus_b_coins + level_b_coins;
      v_bonus_a_coins := v_bonus_a_coins + level_a_coins;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Update profile
  IF leveled_up THEN
    UPDATE public.profiles
    SET 
      level = new_level_val,
      current_xp = new_xp,
      total_xp = new_total_xp,
      a_coin_balance = COALESCE(a_coin_balance, 0) + v_bonus_a_coins,
      b_coin_balance = COALESCE(b_coin_balance, 0) + v_bonus_b_coins
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET 
      level = new_level_val,
      current_xp = new_xp,
      total_xp = new_total_xp
    WHERE user_id = p_user_id;
  END IF;

  -- Insert XP transaction
  INSERT INTO public.xp_transactions (user_id, xp_amount, activity_type, activity_id, description)
  VALUES (p_user_id, p_xp_amount, p_activity_type, p_activity_id, p_description);

  -- Return results
  RETURN QUERY SELECT new_level_val, leveled_up, p_xp_amount, v_bonus_a_coins, v_bonus_b_coins;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
