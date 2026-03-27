/**
 * Date/Time Utilities for Daily Dot Creator
 * 
 * All daily activities reset at midnight (12:00 AM) local time:
 * - Habit completions
 * - Inbox rewards
 * - Daily reflections
 * 
 * Greeting changes based on local user time.
 */

/**
 * Get the current date in the user's local timezone
 * This returns the current calendar date (YYYY-MM-DD)
 * 
 * Everything resets at midnight local time.
 */
export const getAppDate = (): string => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

/**
 * Get greeting based on local user time
 */
export const getGreeting = (): string => {
    const now = new Date();
    const hours = now.getHours();

    // 4 AM to Noon (12:00)
    if (hours >= 4 && hours < 12) return "Good Morning";
    
    // Noon (12:00) to 4 PM (16:00)
    if (hours >= 12 && hours < 16) return "Good Afternoon";
    
    // 4 PM (16:00) to Midnight (00:00) AND Midnight to 4 AM
    return "Good Evening";
};

/**
 * Get current local hour (0-23)
 */
export const getISTHour = (): number => {
    return new Date().getHours();
};

/**
 * Check if two dates are the same day in local time
 */
export const isSameAppDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

/**
 * Get date string for a habit completion or reward
 * Uses standard midnight (12:00 AM) IST as day boundary
 */
export const getCompletionDate = (): string => {
    return getAppDate();
};

/**
 * Get current local date string offset by N days
 */
export const getAppDateOffset = (offsetDays: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

/**
 * Calculates the start date of the user's current 28-day cycle in local time.
 */
export const getCycleStartDate = (createdAt: string | undefined): Date => {
    const todayStr = getAppDate();
    const today = new Date(todayStr + "T00:00:00");

    if (!createdAt) {
        const d = new Date(today);
        d.setDate(d.getDate() - 27);
        return d;
    }

    const createdLocal = new Date(createdAt);
    const createdStr = formatLocalISODate(createdLocal);
    const created = new Date(createdStr + "T00:00:00");

    const diffMs = today.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const cycleIndex = Math.floor(Math.max(0, diffDays) / 28);

    const cycleStart = new Date(created.getTime());
    cycleStart.setDate(cycleStart.getDate() + (cycleIndex * 28));
    return cycleStart;
};

/**
 * Ensures we get a consistent YYYY-MM-DD string that represents the exact calendar
 * date locally without applying UTC transformations that could shift it backwards.
 */
export const formatLocalISODate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};
