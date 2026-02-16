import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Reminder {
    id: string;
    title: string;
    time: string; // HH:mm
    date: string; // YYYY-MM-DD
    isSpecial: boolean;
    completed: boolean;
    notifiedDay?: boolean;
    notifiedTime?: boolean;
}

interface RemindersState {
    reminders: Reminder[];
    addReminder: (reminder: Omit<Reminder, "id" | "completed">) => void;
    deleteReminder: (id: string) => void;
    toggleCompletion: (id: string) => void;
    markAsNotified: (id: string, type: "day" | "time") => void;
    getRemindersForDate: (date: string) => Reminder[];
}

export const useReminders = create<RemindersState>()(
    persist(
        (set, get) => ({
            reminders: [],
            addReminder: (reminder) => set((state) => ({
                reminders: [...state.reminders, { ...reminder, id: crypto.randomUUID(), completed: false }]
            })),
            deleteReminder: (id) => set((state) => ({
                reminders: state.reminders.filter((r) => r.id !== id)
            })),
            toggleCompletion: (id) => set((state) => ({
                reminders: state.reminders.map((r) => r.id === id ? { ...r, completed: !r.completed } : r)
            })),
            markAsNotified: (id, type) => set((state) => ({
                reminders: state.reminders.map((r) => {
                    if (r.id !== id) return r;
                    return {
                        ...r,
                        notifiedDay: type === "day" ? true : r.notifiedDay,
                        notifiedTime: type === "time" ? true : r.notifiedTime,
                    };
                })
            })),
            getRemindersForDate: (date) => get().reminders.filter((r) => r.date === date).sort((a, b) => a.time.localeCompare(b.time)),
        }),
        {
            name: "daily-dot-reminders",
        }
    )
);
