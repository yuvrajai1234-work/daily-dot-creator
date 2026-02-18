import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { getAppDate } from "@/lib/dateUtils";

// B coin max balance per level: level 1 = 75, level 2 = 80, ... level 50 = 320
export const getMaxBCoins = (level: number) => 70 + level * 5;

// Interface for claimed rewards
export interface ClaimedReward {
  id: string;
  user_id: string;
  reward_id: string;
  reward_type: string;
  claim_date: string;
  coins_claimed: number;
  claimed_at: string;
}

// Hook to get today's claimed rewards
export const useClaimedRewards = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["claimed-rewards", user?.id],
    queryFn: async (): Promise<ClaimedReward[]> => {
      if (!user) return [];

      const today = getAppDate(); // Current date in IST (resets at midnight)
      const { data, error } = await supabase
        .from("claimed_rewards")
        .select("*")
        .eq("user_id", user.id)
        .eq("claim_date", today);

      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!user,
  });
};

export const useClaimACoins = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, achievementId }: { amount: number; achievementId?: string }) => {
      // Get current balance
      const { data: profile, error: fetchErr } = await supabase
        .from("profiles")
        .select("a_coin_balance")
        .eq("user_id", user!.id)
        .single();
      if (fetchErr) throw fetchErr;

      const newBalance = (profile.a_coin_balance || 0) + amount;
      const { error } = await supabase
        .from("profiles")
        .update({ a_coin_balance: newBalance })
        .eq("user_id", user!.id);
      if (error) throw error;

      // Also record achievement if provided
      if (achievementId) {
        await supabase
          .from("user_achievements")
          .insert({ user_id: user!.id, achievement_id: achievementId })
          .select()
          .single();
      }

      return newBalance;
    },
    onSuccess: async (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });

      // Award XP for claiming achievement
      try {
        await supabase.rpc("add_xp_to_user", {
          p_user_id: user!.id,
          p_xp_amount: 20,
          p_activity_type: "claim_reward",
          p_activity_id: vars.achievementId,
          p_description: "Claimed an achievement reward"
        });
      } catch (error) {
        console.error("Failed to award XP:", error);
      }

      toast.success(`🏆 Claimed ${vars.amount} A Coins! (+20 XP)`);
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.info("Already claimed!");
      } else {
        toast.error(error.message || "Failed to claim");
      }
    },
  });
};

export const useClaimBCoins = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, rewardId }: { amount: number; rewardId?: string }) => {
      const { data: profile, error: fetchErr } = await supabase
        .from("profiles")
        .select("b_coin_balance, level, b_coin_level, b_coin_last_reset")
        .eq("user_id", user!.id)
        .single();
      if (fetchErr) throw fetchErr;

      // Check weekly reset
      const lastReset = new Date(profile.b_coin_last_reset);
      const now = new Date();
      const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);

      let currentBalance = profile.b_coin_balance || 0;
      let resetDate = profile.b_coin_last_reset;

      if (daysSinceReset >= 7) {
        currentBalance = 0;
        resetDate = now.toISOString();
      }

      // Use XP Level for B Coin Limit
      const maxB = getMaxBCoins(profile.level || 1);
      const newBalance = Math.min(currentBalance + amount, maxB);

      const { error } = await supabase
        .from("profiles")
        .update({ b_coin_balance: newBalance, b_coin_last_reset: resetDate })
        .eq("user_id", user!.id);
      if (error) throw error;

      // Record the claim if rewardId is provided
      if (rewardId) {
        const { error: claimError } = await supabase
          .from("claimed_rewards")
          .insert({
            user_id: user!.id,
            reward_id: rewardId,
            reward_type: "quest",
            claim_date: getAppDate(), // Use IST date explicitly
            coins_claimed: amount,
          });
        if (claimError) throw claimError;
      }

      return newBalance;
    },
    onSuccess: async (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["claimed-rewards"] });

      // Award XP for claiming quest reward
      try {
        await supabase.rpc("add_xp_to_user", {
          p_user_id: user!.id,
          p_xp_amount: 10,
          p_activity_type: "claim_reward",
          p_activity_id: vars.rewardId,
          p_description: "Claimed a quest reward"
        });
      } catch (error) {
        console.error("Failed to award XP:", error);
      }

      toast.success(`🪙 Claimed ${vars.amount} B Coins! (+10 XP)`);
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate") || error.code === "23505") {
        toast.info("Already claimed today!");
      } else {
        toast.error(error.message || "Failed to claim");
      }
    },
  });
};

export const useClaimStreakReward = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, rewardId }: { amount: number; rewardId: string }) => {
      const { data: profile, error: fetchErr } = await supabase
        .from("profiles")
        .select("a_coin_balance")
        .eq("user_id", user!.id)
        .single();
      if (fetchErr) throw fetchErr;

      const newBalance = (profile.a_coin_balance || 0) + amount;

      const { error } = await supabase
        .from("profiles")
        .update({ a_coin_balance: newBalance })
        .eq("user_id", user!.id);
      if (error) throw error;

      // Record the claim
      const { error: claimError } = await supabase
        .from("claimed_rewards")
        .insert({
          user_id: user!.id,
          reward_id: rewardId,
          reward_type: "streak",
          claim_date: getAppDate(), // Use IST date explicitly
          coins_claimed: amount,
        });
      if (claimError) throw claimError;

      return newBalance;
    },
    onSuccess: async (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["claimed-rewards"] });

      // Award XP for claiming streak reward
      try {
        await supabase.rpc("add_xp_to_user", {
          p_user_id: user!.id,
          p_xp_amount: 30, // Higher XP for streaks
          p_activity_type: "streak", // Ensure this activity type exists in XP_REWARDS or is handled
          p_activity_id: vars.rewardId,
          p_description: "Claimed a streak reward"
        });
      } catch (error) {
        console.error("Failed to award XP:", error);
      }

      toast.success(`🏆 Claimed ${vars.amount} A Coins! (+30 XP)`);
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate") || error.code === "23505") {
        toast.info("Already claimed today!");
      } else {
        toast.error(error.message || "Failed to claim");
      }
    },
  });
};

export const useSpendBCoins = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      const { data: profile, error: fetchErr } = await supabase
        .from("profiles")
        .select("b_coin_balance")
        .eq("user_id", user!.id)
        .single();
      if (fetchErr) throw fetchErr;

      if ((profile.b_coin_balance || 0) < amount) {
        throw new Error("Not enough B Coins!");
      }

      const newBalance = (profile.b_coin_balance || 0) - amount;
      const { error } = await supabase
        .from("profiles")
        .update({ b_coin_balance: newBalance })
        .eq("user_id", user!.id);
      if (error) throw error;
      return newBalance;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Not enough B Coins");
    },
  });
};

export const useSpendACoins = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      const { data: profile, error: fetchErr } = await supabase
        .from("profiles")
        .select("a_coin_balance")
        .eq("user_id", user!.id)
        .single();
      if (fetchErr) throw fetchErr;

      if ((profile.a_coin_balance || 0) < amount) {
        throw new Error("Not enough A Coins!");
      }

      const newBalance = (profile.a_coin_balance || 0) - amount;
      const { error } = await supabase
        .from("profiles")
        .update({ a_coin_balance: newBalance })
        .eq("user_id", user!.id);
      if (error) throw error;
      return newBalance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Not enough A Coins");
    },
  });
};
