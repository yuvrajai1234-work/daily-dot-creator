import { useRewardNotifications } from "@/hooks/useRewardNotifications";
import { useReminderToasts } from "@/hooks/useReminderToasts";

/**
 * Invisible component that watches for notifications.
 * Extracted to its own component to avoid HMR hook-count issues in MainLayout.
 */
export const NotificationWatcher = () => {
  useRewardNotifications();
  useReminderToasts();
  return null;
};
