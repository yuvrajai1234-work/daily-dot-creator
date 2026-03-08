import { useEffect } from "react";
import { format } from "date-fns";
import { usePopupNotifications } from "@/contexts/NotificationContext";
import { useReminders } from "@/hooks/useReminders";
import { sendDeviceNotification, sendDailyReminderNotification } from "@/lib/deviceNotifications";

export const useReminderToasts = () => {
    const { showNotification } = usePopupNotifications();
    const { reminders, markAsNotified } = useReminders();

    // Daily reminder scheduler based on user's preferred time
    useEffect(() => {
        const scheduleDaily = () => {
            try {
                const raw = localStorage.getItem("dd_settings_v2");
                if (!raw) return;
                const settings = JSON.parse(raw);
                if (!settings.dailyReminders) return;

                const [hours, minutes] = (settings.reminderTime || "09:00").split(":").map(Number);
                const now = new Date();
                const target = new Date();
                target.setHours(hours, minutes, 0, 0);

                // If time already passed today, schedule for tomorrow
                if (target <= now) {
                    target.setDate(target.getDate() + 1);
                }

                const delay = target.getTime() - now.getTime();
                const timer = setTimeout(() => {
                    sendDailyReminderNotification();
                    // Re-schedule for next day
                    scheduleDaily();
                }, delay);

                return timer;
            } catch {
                return undefined;
            }
        };

        const timer = scheduleDaily();
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, []);

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
                        duration: 8000,
                    });
                    sendDeviceNotification("🎉 Special Event Today!", {
                        body: `Don't forget: ${r.title}`,
                        tag: `event-${r.id}`,
                        onClick: () => { window.location.href = "/calendar"; },
                    });
                    markAsNotified(r.id, "day");
                }

                // 2. Time-based Notification
                if (!r.notifiedTime && currentTime >= r.time) {
                    showNotification({
                        type: r.isSpecial ? "event" : "reminder",
                        title: r.isSpecial ? "🚨 Event Starting!" : "🔔 Reminder",
                        message: r.isSpecial ? `It's time for: ${r.title}` : r.title,
                        route: "/calendar",
                        duration: r.isSpecial ? 8000 : 5000,
                    });
                    sendDeviceNotification(
                        r.isSpecial ? "🚨 Event Starting!" : "🔔 Reminder",
                        {
                            body: r.isSpecial ? `It's time for: ${r.title}` : r.title,
                            tag: `reminder-${r.id}`,
                            onClick: () => { window.location.href = "/calendar"; },
                        }
                    );
                    markAsNotified(r.id, "time");
                }
            });
        };

        checkReminders();
        const interval = setInterval(checkReminders, 30000);
        return () => clearInterval(interval);
    }, [reminders, showNotification, markAsNotified]);
};
