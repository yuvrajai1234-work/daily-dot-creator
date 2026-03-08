import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  coin_reward: number;
  rarity?: string;
  xp_reward?: number;
  year_target?: number; // which year (1-5) this is targeted for
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

export type UserStats = {
  totalCompletions: number;
  totalHabits: number;
  totalReflections: number;
  bestStreak: number;
  currentStreak: number;
  level: number;
  totalXP: number;
  daysActive: number;
  communityPosts: number;
  longestHabitStreak: number;
};

export const useAchievements = () => {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });
      if (error) throw error;
      return data as Achievement[];
    },
  });
};

export const useUserAchievements = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*");
      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user,
  });
};

export const useClaimAchievement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (achievementId: string) => {
      const { data, error } = await supabase
        .from("user_achievements")
        .insert({ user_id: user!.id, achievement_id: achievementId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
      toast.success("🏆 Achievement unlocked!");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.info("Already earned this achievement!");
      } else {
        toast.error(error.message || "Failed to claim");
      }
    },
  });
};

export const useUserStats = (targetUserId?: string) => {
  const { user } = useAuth();
  const uId = targetUserId || user?.id;

  return useQuery({
    queryKey: ["user-stats", uId],
    queryFn: async (): Promise<UserStats> => {
      if (!uId)
        return {
          totalCompletions: 0,
          totalHabits: 0,
          totalReflections: 0,
          bestStreak: 0,
          currentStreak: 0,
          level: 1,
          totalXP: 0,
          daysActive: 0,
          communityPosts: 0,
          longestHabitStreak: 0,
        };

      // Get total completions
      const { count: totalCompletions } = await supabase
        .from("habit_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uId);

      // Get total habits
      const { count: totalHabits } = await supabase
        .from("habits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uId);

      // Get total reflections
      const { count: totalReflections } = await supabase
        .from("daily_reflections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uId);

      // Get profile (level, totalXP)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("level, total_xp")
        .eq("user_id", uId)
        .single();

      // Get community posts count
      const { count: communityPosts } = await (supabase as any)
        .from("xp_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uId)
        .eq("activity_type", "community");

      // ── Streak calculation using all unique dates across all habits ────────
      const { data: completionRows } = await supabase
        .from("habit_completions")
        .select("completion_date")
        .eq("user_id", uId);

      // Deduplicate and sort ascending (ISO date strings sort correctly as strings)
      const uniqueDatesAsc: string[] = [
        ...new Set((completionRows || []).map((r: any) => r.completion_date as string)),
      ].sort();

      let currentStreak = 0;
      let bestStreak = 0;
      const daysActive = uniqueDatesAsc.length;

      if (uniqueDatesAsc.length > 0) {
        // ── All-time best streak (longest consecutive-day sequence ever) ──
        let run = 1;
        bestStreak = 1;
        for (let i = 1; i < uniqueDatesAsc.length; i++) {
          const prev = new Date(uniqueDatesAsc[i - 1] + "T00:00:00");
          const curr = new Date(uniqueDatesAsc[i] + "T00:00:00");
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
          if (diffDays === 1) {
            run++;
            if (run > bestStreak) bestStreak = run;
          } else {
            run = 1;
          }
        }

        // ── Current streak (consecutive days ending today or yesterday) ──
        const dateSet = new Set(uniqueDatesAsc);

        const localDateStr = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };

        const today = new Date();
        let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (!dateSet.has(localDateStr(cursor))) {
          cursor.setDate(cursor.getDate() - 1);
        }

        while (dateSet.has(localDateStr(cursor))) {
          currentStreak++;
          cursor.setDate(cursor.getDate() - 1);
        }
      }

      return {
        totalCompletions: totalCompletions || 0,
        totalHabits: totalHabits || 0,
        totalReflections: totalReflections || 0,
        bestStreak,
        currentStreak,
        level: (profileData as any)?.level || 1,
        totalXP: (profileData as any)?.total_xp || 0,
        daysActive,
        communityPosts: communityPosts || 0,
        longestHabitStreak: bestStreak,
      };
    },
    enabled: !!uId,
  });
};
