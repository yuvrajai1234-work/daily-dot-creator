import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { getAppDate, getAppDateOffset } from "@/lib/dateUtils";
import { optimisticXPUpdate } from "@/hooks/useXP";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  sort_order?: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string;
  effort_level: number;
  created_at: string;
}

export const useHabits = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["habits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });
};

export const useTodayCompletions = () => {
  const { user } = useAuth();
  const today = getAppDate(); // Current date in IST (resets at midnight)

  return useQuery({
    queryKey: ["completions", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("completion_date", today);
      if (error) throw error;
      return data as HabitCompletion[];
    },
    enabled: !!user,
  });
};

export const useWeekCompletions = () => {
  const { user } = useAuth();
  // Fetch 28 days (today + 27 previous days) to support 28-day graphs
  const todayStr = getAppDate();
  const past28DaysStr = getAppDateOffset(-27);

  return useQuery({
    queryKey: ["week-completions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", user!.id)
        .gte("completion_date", past28DaysStr)
        .lte("completion_date", todayStr);
      if (error) throw error;
      return data as HabitCompletion[];
    },
    enabled: !!user,
  });
};

export const useTodayReflection = () => {
  const { user } = useAuth();
  const today = getAppDate(); // Current date in IST (resets at midnight)

  return useQuery({
    queryKey: ["today-reflection", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_reflections")
        .select("*")
        .eq("user_id", user!.id)
        .eq("reflection_date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAllCompletions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-completions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", user!.id)
        .order("completion_date", { ascending: false });
      if (error) throw error;
      return data as HabitCompletion[];
    },
    enabled: !!user,
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (habit: { name: string; icon: string; color: string; description?: string }) => {
      // Check if habit already exists
      const { data: existingHabits, error: searchError } = await supabase
        .from("habits")
        .select("id")
        .eq("user_id", user!.id)
        .ilike("name", habit.name);

      if (searchError) throw searchError;

      if (existingHabits && existingHabits.length > 0) {
        throw new Error(`You already have a habit named "${habit.name}"!`);
      }

      // Creating habit costs 20 B coins
      const { data: profile } = await supabase
        .from("profiles")
        .select("b_coin_balance")
        .eq("user_id", user!.id)
        .single();

      const bBalance = (profile as any)?.b_coin_balance || 0;
      if (bBalance < 50) {
        throw new Error("Not enough B Coins! You need 50 B Coins to create a habit.");
      }

      // Deduct B coins
      await supabase
        .from("profiles")
        .update({ b_coin_balance: bBalance - 50 })
        .eq("user_id", user!.id);

      // Get max sort_order
      const { data: maxSortData } = await supabase
        .from("habits")
        .select("sort_order")
        .eq("user_id", user!.id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSortOrder = (maxSortData?.sort_order ?? 0) + 1;

      const { data, error } = await supabase
        .from("habits")
        .insert({ ...habit, user_id: user!.id, sort_order: nextSortOrder })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Habit created! (-50 B Coins)");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create habit");
    },
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete habit");
    },
  });
};

export const useUpdateHabitsOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (habitsKeys: { id: string; sort_order: number }[]) => {
      // Supabase natively doesn't have a built-in multiple row update with distinct values (UPSERT works but we must fetch all required columns to avoid nullifying them)
      // For a few rows, we can just promise.all or use an RPC. Wait, upsert with `onConflict: 'id'` should safely update if we provide the id and sort_order ONLY, as long as it's not overriding unspecified columns with default? Wait! Supabase UPSERT overwrites whole rows if we omit columns! (it acts as INSERT unless we use JSON-based RPC)
      // To be safe, we will do sequential updates as habits count is usually small (e.g. <20)

      const promises = habitsKeys.map((h) =>
        supabase.from("habits").update({ sort_order: h.sort_order }).eq("id", h.id).eq("user_id", user!.id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      // Don't strongly invalidate immediately to prevent UI jumps if using optimistic UI,
      // but if we are not optimistic syncing we can invalidate. 
      // In this case, Dashboard will handle optimistic updates via local state.
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update sorting");
    },
  });
};

export const useToggleCompletion = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const today = getAppDate(); // Current date in IST (resets at midnight)

  return useMutation({
    mutationFn: async ({
      habitId,
      isCompleted,
    }: {
      habitId: string;
      isCompleted: boolean;
    }) => {
      if (isCompleted) {
        const { error } = await supabase
          .from("habit_completions")
          .delete()
          .eq("habit_id", habitId)
          .eq("completion_date", today);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("habit_completions")
          .insert({ habit_id: habitId, user_id: user!.id, completion_date: today, effort_level: 3 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["completions"] });
      queryClient.invalidateQueries({ queryKey: ["week-completions"] });
      queryClient.invalidateQueries({ queryKey: ["all-completions"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update");
    },
  });
};

export const useLogEffort = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const today = getAppDate(); // Current date in IST (resets at midnight)

  return useMutation({
    mutationFn: async ({ habitId, effortLevel, isNew }: { habitId: string; effortLevel: number; isNew?: boolean }) => {
      // Check if already logged today (update doesn't cost B coins)
      const { data: existing } = await supabase
        .from("habit_completions")
        .select("id")
        .eq("habit_id", habitId)
        .eq("completion_date", today)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("habit_completions")
          .update({ effort_level: effortLevel })
          .eq("id", existing.id);
        if (error) throw error;
        return { isUpdate: true };
      } else {
        // New log costs 10 B coins
        const { data: profile } = await supabase
          .from("profiles")
          .select("b_coin_balance")
          .eq("user_id", user!.id)
          .single();

        const bBalance = (profile as any)?.b_coin_balance || 0;
        if (bBalance < 15) {
          throw new Error("Not enough B Coins! You need 15 B Coins to log a habit.");
        }

        // Deduct B coins
        await supabase
          .from("profiles")
          .update({ b_coin_balance: bBalance - 15 })
          .eq("user_id", user!.id);

        const { error } = await supabase
          .from("habit_completions")
          .insert({ habit_id: habitId, user_id: user!.id, completion_date: today, effort_level: effortLevel });
        if (error) throw error;
        return { isUpdate: false };
      }
    },
    onMutate: async ({ isNew }) => {
      if (isNew) {
        // Optimistically update XP immediately for 0ms delay
        optimisticXPUpdate(queryClient, user!.id, 10);
        return { xpAdded: true };
      }
      return { xpAdded: false };
    },
    onSuccess: async (result, variables) => {
      // Award XP for new habit log (not for updates)
      if (!result.isUpdate) {
        try {
          // Add XP first so invalidation fetches updated data
          await supabase.rpc("add_xp_to_user", {
            p_user_id: user!.id,
            p_xp_amount: 10,
            p_activity_type: "habit_log",
            p_activity_id: variables.habitId,
            p_description: "Logged a habit"
          });

          // Note: XP was already optimistically updated in onMutate
        } catch (error) {
          console.error("Failed to award XP:", error);
        }
      }

      // Invalidate queries after XP update
      queryClient.invalidateQueries({ queryKey: ["completions"] });
      queryClient.invalidateQueries({ queryKey: ["week-completions"] });
      queryClient.invalidateQueries({ queryKey: ["all-completions"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["level-info"] });

      if (result.isUpdate) {
        toast.success("Effort level updated!");
      } else {
        toast.success("Effort logged! (-15 B Coins, +10 XP)");
      }
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic XP update if it failed
      if (context?.xpAdded) {
        optimisticXPUpdate(queryClient, user!.id, -10);
      }
      toast.error(error.message || "Failed to log effort");
    },
  });
};

export const useArchivedHabits = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["archived-habits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_archived", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });
};

export const useUnarchiveHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from("habits")
        .update({ is_archived: false })
        .eq("id", habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["archived-habits"] });
      toast.success("Habit restored!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to restore habit");
    },
  });
};

export const useArchiveHabit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (habitId: string) => {
      // Archiving costs 50 B coins (streak protection premium feature)
      const { data: profile } = await supabase
        .from("profiles")
        .select("b_coin_balance")
        .eq("user_id", user!.id)
        .single();

      const bBalance = (profile as any)?.b_coin_balance || 0;
      if (bBalance < 50) {
        throw new Error("Not enough B Coins! You need 50 B Coins to archive a habit (streak protection).");
      }

      await supabase
        .from("profiles")
        .update({ b_coin_balance: bBalance - 50 })
        .eq("user_id", user!.id);

      const { error } = await supabase
        .from("habits")
        .update({ is_archived: true })
        .eq("id", habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["archived-habits"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Habit archived! (-50 B Coins) — Your streak is now protected.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to archive habit");
    },
  });
};

export const useReflections = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reflections", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_reflections")
        .select("*")
        .eq("user_id", user!.id)
        .order("reflection_date", { ascending: false })
        .limit(7);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useSaveReflection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ content, isEdit }: { content: string, isEdit?: boolean }) => {
      const today = getAppDate(); // Current date in IST (resets at midnight)

      if (!isEdit) {
        // Saving journal costs 10 B coins
        const { data: profile } = await supabase
          .from("profiles")
          .select("b_coin_balance")
          .eq("user_id", user!.id)
          .single();

        const bBalance = (profile as any)?.b_coin_balance || 0;
        if (bBalance < 10) {
          throw new Error("Not enough B Coins! You need 10 B Coins to save a journal.");
        }

        // Deduct B coins
        await supabase
          .from("profiles")
          .update({ b_coin_balance: bBalance - 10 })
          .eq("user_id", user!.id);
      }

      const { data, error } = await supabase
        .from("daily_reflections")
        .upsert(
          { user_id: user!.id, reflection_date: today, content },
          { onConflict: "user_id,reflection_date" }
        )
        .select()
        .single();
      if (error) throw error;
      return { data, isEdit };
    },
    onSuccess: async (result) => {
      if (!result.isEdit) {
        // Award XP for journal entry
        try {
          await supabase.rpc("add_xp_to_user", {
            p_user_id: user!.id,
            p_xp_amount: 15,
            p_activity_type: "journal",
            p_description: "Wrote a journal entry"
          });

          // Optimistically update XP
          optimisticXPUpdate(queryClient, user!.id, 15);
        } catch (error) {
          console.error("Failed to award XP:", error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["reflections"] });
      queryClient.invalidateQueries({ queryKey: ["today-reflection"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["level-info"] });

      if (result.isEdit) {
        toast.success("Reflection updated!");
      } else {
        toast.success("Reflection saved! (-10 B Coins, +15 XP)");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save reflection");
    },
  });
};

export const useDeleteReflection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("daily_reflections")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflections"] });
      queryClient.invalidateQueries({ queryKey: ["today-reflection"] });
      toast.success("Reflection deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete reflection");
    },
  });
};

export const useHabitStreak = (habitId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["streak", habitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_completions")
        .select("completion_date")
        .eq("habit_id", habitId)
        .order("completion_date", { ascending: false });
      if (error) throw error;

      if (!data || data.length === 0) return 0;

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < data.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const completionDate = new Date(data[i].completion_date + "T00:00:00");

        if (completionDate.getTime() === expected.getTime()) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    },
    enabled: !!user && !!habitId,
  });
};
