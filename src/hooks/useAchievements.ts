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
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

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

export const useUserStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      // Get total completions
      const { count: totalCompletions } = await supabase
        .from("habit_completions")
        .select("*", { count: "exact", head: true });

      // Get total habits
      const { count: totalHabits } = await supabase
        .from("habits")
        .select("*", { count: "exact", head: true });

      // Get total reflections
      const { count: totalReflections } = await supabase
        .from("daily_reflections")
        .select("*", { count: "exact", head: true });

      // Calculate best streak across all habits
      const { data: habits } = await supabase
        .from("habits")
        .select("id");

      let bestStreak = 0;
      if (habits) {
        for (const habit of habits) {
          const { data: completions } = await supabase
            .from("habit_completions")
            .select("completion_date")
            .eq("habit_id", habit.id)
            .order("completion_date", { ascending: false });

          if (completions && completions.length > 0) {
            let streak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < completions.length; i++) {
              const expected = new Date(today);
              expected.setDate(expected.getDate() - i);
              const completionDate = new Date(completions[i].completion_date + "T00:00:00");
              if (completionDate.getTime() === expected.getTime()) {
                streak++;
              } else {
                break;
              }
            }
            bestStreak = Math.max(bestStreak, streak);
          }
        }
      }

      return {
        totalCompletions: totalCompletions || 0,
        totalHabits: totalHabits || 0,
        totalReflections: totalReflections || 0,
        bestStreak,
      };
    },
    enabled: !!user,
  });
};
