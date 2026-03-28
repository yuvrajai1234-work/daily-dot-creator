import { useEffect } from "react";
import { useHabits, useTodayCompletions } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useAchievements";
import { useTheme } from "@/contexts/ThemeContext";
import { sendDeviceNotification } from "@/lib/deviceNotifications";
import { format } from "date-fns";

/**
 * Hook that watches for expiring streaks and sends a warning notification
 */
export const useStreakWatcher = () => {
    const { settings } = useTheme();
    const { data: habits = [] } = useHabits();
    const { data: todayCompletions = [] } = useTodayCompletions();
    const { data: stats } = useUserStats();

    useEffect(() => {
        if (!settings.streakAlerts || !settings.notifications) return;
        if (!stats || stats.currentStreak === 0) return;

        const checkStreak = () => {
            const now = new Date();
            const hour = now.getHours();

            // Only warn in the evening (after 7 PM)
            if (hour >= 19) {
                const totalHabits = habits.length;
                const completedToday = todayCompletions.length;

                // If not all habits are completed and user has a streak
                if (completedToday < totalHabits && totalHabits > 0) {
                    const dismissedToday = localStorage.getItem(`streak_warn_dismissed_${format(now, "yyyy-MM-dd")}`);
                    
                    if (!dismissedToday) {
                        sendDeviceNotification("🔥 Don't break your streak!", {
                            body: `You still have ${totalHabits - completedToday} habits to log today! Keep it going!`,
                            tag: "streak-warning",
                            settingKey: "streakAlerts",
                            onClick: () => { window.location.href = "/dashboard"; }
                        });
                        
                        // Only notify once per evening
                        localStorage.setItem(`streak_warn_dismissed_${format(now, "yyyy-MM-dd")}`, "true");
                    }
                }
            }
        };

        // Check every hour
        const interval = setInterval(checkStreak, 3600000); 
        // Also check immediately
        checkStreak();

        return () => clearInterval(interval);
    }, [habits.length, todayCompletions.length, stats, settings.streakAlerts, settings.notifications]);
};
