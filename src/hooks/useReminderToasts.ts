import { useEffect } from "react";
import { format } from "date-fns";
import { usePopupNotifications } from "@/contexts/NotificationContext";
import { useReminders } from "@/hooks/useReminders";

export const useReminderToasts = () => {
    const { showNotification } = usePopupNotifications();
    const { reminders, markAsNotified } = useReminders();

    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            const todayStr = format(now, "yyyy-MM-dd");
            const currentTime = format(now, "HH:mm");

            const todayReminders = reminders.filter((r) => r.date === todayStr && !r.completed);

            todayReminders.forEach((r) => {
                // 1. Special Event Notification (Start of Day)
                if (r.isSpecial && !r.notifiedDay) {
                    showNotification({
                        type: "event",
                        title: "🎉 Special Event Today!",
                        message: `Don't forget: ${r.title}`,
                        route: "/calendar",
                        duration: 8000, // Longer duration for special events
                    });
                    markAsNotified(r.id, "day");
                }

                // 2. Time-based Notification (For both special and regular)
                // Trigger if time has arrived or passed
                if (!r.notifiedTime && currentTime >= r.time) {
                    showNotification({
                        type: r.isSpecial ? "event" : "reminder",
                        title: r.isSpecial ? "🚨 Event Starting!" : "🔔 Reminder",
                        message: r.isSpecial ? `It's time for: ${r.title}` : r.title,
                        route: "/calendar",
                        duration: r.isSpecial ? 8000 : 5000,
                    });
                    markAsNotified(r.id, "time");
                }
            });
        };

        // Check immediately on mount/update
        checkReminders();

        // Check every 30 seconds for time updates
        const interval = setInterval(checkReminders, 30000);
        return () => clearInterval(interval);
    }, [reminders, showNotification, markAsNotified]); // Re-run if reminders list changes
};
