/**
 * Browser Notification API wrapper for device-level push notifications.
 * These appear as OS-level notifications even when the tab is in the background.
 */

const SETTINGS_KEY = "dd_settings_v2";

/** Check if browser supports notifications */
export const isNotificationSupported = (): boolean => {
  return "Notification" in window;
};

export const isIOS = (): boolean => {
  return (
    [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13+ detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
};

export const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone === true);
};

/** Get current permission status */
export const getNotificationPermission = (): NotificationPermission | "unsupported" => {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
};

/** Request notification permission from the user */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
};

/** Read a specific notification setting from localStorage */
const getNotificationSetting = (key: string): boolean => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return true; // default on
    const settings = JSON.parse(raw);
    return settings[key] !== false; // default true unless explicitly false
  } catch {
    return true;
  }
};

/** Send a device-level notification */
export const sendDeviceNotification = (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string; // prevents duplicate notifications with the same tag
    onClick?: () => void;
    /** Which setting gate to check: 'notifications' (master), 'achievementAlerts', 'streakAlerts', 'dailyReminders' */
    settingKey?: string;
  }
): void => {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  // Check master toggle
  if (!getNotificationSetting("notifications")) return;

  // Check specific setting gate if provided
  if (options?.settingKey && !getNotificationSetting(options.settingKey)) return;

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || "/favicon.png",
      tag: options?.tag,
      badge: "/favicon.png",
      silent: false,
    });

    if (options?.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick!();
        notification.close();
      };
    }

    // Auto-close after 6 seconds
    setTimeout(() => notification.close(), 6000);
  } catch (err) {
    console.warn("Failed to send device notification:", err);
  }
};

/** Send a daily reminder notification */
export const sendDailyReminderNotification = (): void => {
  sendDeviceNotification("⏰ Time to log your habits!", {
    body: "Don't break your streak — open DailyDots and log today's progress.",
    tag: "daily-reminder",
    settingKey: "dailyReminders",
    onClick: () => {
      window.location.href = "/dashboard";
    },
  });
};

/** Send an achievement notification */
export const sendAchievementNotification = (name: string, reward: number): void => {
  sendDeviceNotification(`🏆 Achievement Unlocked: ${name}`, {
    body: `You've earned ${reward} A Coins! Tap to claim.`,
    tag: `achievement-${name}`,
    settingKey: "achievementAlerts",
    onClick: () => {
      window.location.href = "/inbox";
    },
  });
};

/** Send a streak notification */
export const sendStreakNotification = (days: number): void => {
  sendDeviceNotification(`🔥 ${days}-Day Streak!`, {
    body: `Amazing! You've maintained a ${days}-day streak. Claim your bonus!`,
    tag: `streak-${days}`,
    settingKey: "streakAlerts",
    onClick: () => {
      window.location.href = "/inbox";
    },
  });
};

/** Send a reward claimable notification */
export const sendRewardNotification = (title: string, message: string): void => {
  sendDeviceNotification(title, {
    body: message,
    tag: `reward-${Date.now()}`,
    onClick: () => {
      window.location.href = "/inbox";
    },
  });
};
