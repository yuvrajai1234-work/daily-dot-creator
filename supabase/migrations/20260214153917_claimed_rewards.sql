
-- Create claimed_rewards table to track daily quest/reward claims
CREATE TABLE public.claimed_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'quest',
  claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
  coins_claimed INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_id, claim_date)
);

-- Enable RLS
ALTER TABLE public.claimed_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users manage their own claims
CREATE POLICY "Users can view own claimed rewards" 
  ON public.claimed_rewards FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claimed rewards" 
  ON public.claimed_rewards FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_claimed_rewards_user_date 
  ON public.claimed_rewards(user_id, claim_date);

CREATE INDEX idx_claimed_rewards_lookup 
  ON public.claimed_rewards(user_id, reward_id, claim_date);
