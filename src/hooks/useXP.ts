import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export interface XPTransaction {
    id: string;
    user_id: string;
    xp_amount: number;
    activity_type: string;
    activity_id: string | null;
    description: string | null;
    created_at: string;
}

export interface LevelInfo {
    level: number;
    currentXP: number;
    totalXP: number;
    xpNeeded: number;
    progress: number; // 0-100 percentage
}

// XP rewards for different activities
export const XP_REWARDS = {
    DAILY_LOGIN: 5,
    HABIT_LOG: 10,
    JOURNAL_ENTRY: 15,
    CLAIM_ACHIEVEMENT: 20,
    CLAIM_QUEST: 10,
    COMMUNITY_POST: 10,
    COMMUNITY_COMMENT: 5,
    PREMIUM_PURCHASE: 25,
    EBOOK_CHAPTER: 10,
    STREAK_MILESTONE: 30,
} as const;

// Calculate XP required for a specific level
export const calculateXPForLevel = (level: number): number => {
    return Math.floor(100 * Math.pow(1.058, level - 1));
};

// Calculate total XP needed to reach a level
export const calculateTotalXPForLevel = (targetLevel: number): number => {
    let total = 0;
    for (let i = 1; i <= targetLevel; i++) {
        total += calculateXPForLevel(i);
    }
    return total;
};

// Get level info from profile data
export const getLevelInfo = (profile: {
    level: number;
    current_xp: number;
    total_xp: number;
}): LevelInfo => {
    const xpNeeded = calculateXPForLevel(profile.level);
    const progress = Math.min(100, (profile.current_xp / xpNeeded) * 100);

    return {
        level: profile.level,
        currentXP: profile.current_xp,
        totalXP: profile.total_xp,
        xpNeeded,
        progress,
    };
};

// Hook to get user's level info
export const useLevelInfo = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["level-info", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("level, current_xp, total_xp")
                .eq("user_id", user!.id)
                .single();

            if (error) throw error;
            return getLevelInfo(data);
        },
        enabled: !!user,
    });
};

// Hook to get XP transaction history
export const useXPTransactions = (limit: number = 50) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["xp-transactions", user?.id, limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("xp_transactions")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data as XPTransaction[];
        },
        enabled: !!user,
    });
};

// Hook to add XP
export const useAddXP = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({
            amount,
            activityType,
            activityId,
            description,
        }: {
            amount: number;
            activityType: keyof typeof XP_REWARDS | string;
            activityId?: string;
            description?: string;
        }) => {
            const { data, error } = await supabase.rpc("add_xp_to_user", {
                p_user_id: user!.id,
                p_xp_amount: amount,
                p_activity_type: activityType,
                p_activity_id: activityId || null,
                p_description: description || null,
            });

            if (error) throw error;
            return data as { new_level: number; level_up: boolean; xp_gained: number }[];
        },
        onSuccess: (data) => {
            const result = data[0];

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ["level-info"] });
            queryClient.invalidateQueries({ queryKey: ["xp-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });

            // Show notification
            if (result.level_up) {
                toast.success(`🎉 Level Up! You reached Level ${result.new_level}!`, {
                    duration: 5000,
                });
            } else {
                toast.success(`+${result.xp_gained} XP earned!`, {
                    duration: 2000,
                });
            }
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to add XP");
        },
    });
};

// Hook to get level leaderboard
export const useLevelLeaderboard = () => {
    return useQuery({
        queryKey: ["level-leaderboard"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("level_leaderboard")
                .select("*")
                .limit(100);

            if (error) throw error;
            return data;
        },
    });
};

// Get level tier/name based on level
export const getLevelTier = (level: number): { name: string; color: string } => {
    if (level >= 90) return { name: "Legendary", color: "hsl(45, 100%, 50%)" };
    if (level >= 75) return { name: "Master", color: "hsl(280, 100%, 60%)" };
    if (level >= 60) return { name: "Expert", color: "hsl(200, 100%, 50%)" };
    if (level >= 45) return { name: "Advanced", color: "hsl(150, 100%, 40%)" };
    if (level >= 30) return { name: "Intermediate", color: "hsl(30, 100%, 50%)" };
    if (level >= 15) return { name: "Apprentice", color: "hsl(0, 0%, 70%)" };
    return { name: "Novice", color: "hsl(0, 0%, 50%)" };
};

// Activity type labels
export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
    habit_log: "Logged Habit",
    journal: "Journal Entry",
    claim_reward: "Claimed Reward",
    achievement: "Achievement",
    community: "Community Activity",
    premium: "Premium Purchase",
    ebook: "E-Book Reading",
    daily_login: "Daily Login",
    streak: "Streak Milestone",
};
