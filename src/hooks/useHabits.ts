import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
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
        .eq("is_archived", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });
};

export const useTodayCompletions = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["completions", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("completion_date", today);
      if (error) throw error;
      return data as HabitCompletion[];
    },
    enabled: !!user,
  });
};

export const useWeekCompletions = () => {
  const { user } = useAuth();
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  return useQuery({
    queryKey: ["week-completions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .gte("completion_date", weekAgo.toISOString().split("T")[0])
        .lte("completion_date", today.toISOString().split("T")[0]);
      if (error) throw error;
      return data as HabitCompletion[];
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
      const { data, error } = await supabase
        .from("habits")
        .insert({ ...habit, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit created!");
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

export const useToggleCompletion = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useMutation({
    mutationFn: async ({
      habitId,
      isCompleted,
    }: {
      habitId: string;
      isCompleted: boolean;
    }) => {
      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from("habit_completions")
          .delete()
          .eq("habit_id", habitId)
          .eq("completion_date", today);
        if (error) throw error;
      } else {
        // Add completion
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

export const useReflections = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reflections", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_reflections")
        .select("*")
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
    mutationFn: async (content: string) => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_reflections")
        .upsert(
          { user_id: user!.id, reflection_date: today, content },
          { onConflict: "user_id,reflection_date" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflections"] });
      toast.success("Reflection saved!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save reflection");
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
