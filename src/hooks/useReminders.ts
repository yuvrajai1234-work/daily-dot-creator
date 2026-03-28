import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";

export interface Reminder {
    id: string;
    userId: string;
    title: string;
    time: string; // HH:mm
    date: string; // YYYY-MM-DD
    isSpecial: boolean;
    completed: boolean;
    notifiedDay: boolean;
    notifiedTime: boolean;
}

export const useRemindersQuery = () => {
    const { user } = useAuth();
    
    return useQuery({
        queryKey: ["reminders", user?.id],
        queryFn: async () => {
            if (!user) return [];
            
            const supabaseAny = supabase as any;
            const { data, error } = await supabaseAny
                .from("reminders")
                .select("*")
                .eq("user_id", user.id);
                
            if (error) {
                console.error("Error fetching reminders", error);
                // Fallback to empty array instead of throwing to prevent app crash if table doesn't exist yet
                return [];
            }
            
            return ((data as any[]) || []).map(r => ({
                id: r.id,
                userId: r.user_id,
                title: r.title,
                time: r.time,
                date: r.date,
                isSpecial: r.is_special,
                completed: r.completed,
                notifiedDay: r.notified_day,
                notifiedTime: r.notified_time,
            })) as Reminder[];
        },
        enabled: !!user,
    });
};

export const useReminders = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: reminders = [] } = useRemindersQuery();

    const addReminderMutation = useMutation({
        mutationFn: async (reminder: { title: string; time: string; date: string; isSpecial: boolean }) => {
            if (!user) throw new Error("Must be logged in to add reminders");
            
            const supabaseAny = supabase as any;
            const { data, error } = await supabaseAny
                .from("reminders")
                .insert({
                    user_id: user.id,
                    title: reminder.title,
                    time: reminder.time,
                    date: reminder.date,
                    is_special: reminder.isSpecial,
                })
                .select()
                .single();
                
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reminders", user?.id] });
        }
    });

    const deleteReminderMutation = useMutation({
        mutationFn: async (id: string) => {
            const supabaseAny = supabase as any;
            const { error } = await supabaseAny
                .from("reminders")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["reminders", user?.id] });
        }
    });

    const markAsNotifiedMutation = useMutation({
        mutationFn: async ({ id, type }: { id: string, type: "day" | "time" }) => {
            const updates = type === "day" 
                ? { notified_day: true } 
                : { notified_time: true };
                
            const supabaseAny = supabase as any;
            const { error } = await supabaseAny
                .from("reminders")
                .update(updates)
                .eq("id", id);
                
            if (error) throw error;
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["reminders", user?.id] });
        }
    });
    
    const pruneExpiredRemindersMutation = useMutation({
        mutationFn: async () => {
            if (!user) return;
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            const currentTime = now.toTimeString().slice(0, 5); // HH:mm
            
            // Delete past non-special reminders
            const supabaseAny = supabase as any;
            const { error } = await supabaseAny
                .from("reminders")
                .delete()
                .eq("user_id", user.id)
                .eq("is_special", false)
                .or(`date.lt.${todayStr},and(date.eq.${todayStr},time.lt.${currentTime})`);
                
            if (error && error.code !== "PGRST116") {
                console.error("Failed to prune reminders:", error);
            }
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["reminders", user?.id] });
        }
    });

    return {
        reminders, // Expose full list if needed
        addReminder: useCallback((r: any) => addReminderMutation.mutate(r), [addReminderMutation]),
        deleteReminder: useCallback((id: string) => deleteReminderMutation.mutate(id), [deleteReminderMutation]),
        markAsNotified: useCallback((id: string, type: "day" | "time") => markAsNotifiedMutation.mutate({ id, type }), [markAsNotifiedMutation]),
        pruneExpiredReminders: useCallback(() => {
            // Only trigger a database delete request if we actually have past reminders locally.
            // This prevents spamming the database every 30 seconds.
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            const currentTime = now.toTimeString().slice(0, 5); // HH:mm
            
            const hasExpired = reminders.some(r => 
                !r.isSpecial && 
                (r.date < todayStr || (r.date === todayStr && r.time < currentTime))
            );
            
            if (hasExpired && !pruneExpiredRemindersMutation.isPending) {
                pruneExpiredRemindersMutation.mutate();
            }
        }, [reminders, pruneExpiredRemindersMutation]),
        getRemindersForDate: useCallback((date: string) => 
            reminders
                .filter(r => r.date === date)
                .sort((a, b) => a.time.localeCompare(b.time)), [reminders]),
        isPending: addReminderMutation.isPending || deleteReminderMutation.isPending
    };
};
