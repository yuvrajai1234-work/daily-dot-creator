/**
 * Date/Time Utilities for Daily Dot Creator
 * 
 * All daily activities reset at midnight (12:00 AM) IST:
 * - Habit completions
 * - Inbox rewards
 * - Daily reflections
 * 
 * Greeting changes at 4:00 AM IST for natural timing
 */

/**
 * Get the current date in IST timezone
 * This returns the current calendar date in India (IST = UTC+5:30)
 * 
 * Everything resets at midnight IST (standard date boundary)
 * 
 * Example:
 * - 2026-02-15 11:59 PM IST → Returns "2026-02-15"
 * - 2026-02-16 12:00 AM IST → Returns "2026-02-16"
 */
export const getAppDate = (): string => {
    const now = new Date();

    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istTime = new Date(now.getTime() + istOffset);

    // Return the date in IST
    return istTime.toISOString().split("T")[0];
};

/**
 * Get greeting based on IST time
 * Morning greeting starts at 4:00 AM IST
 * 
 * Time ranges (IST):
 * - 4:00 AM - 11:59 AM: "Good Morning" ☀️
 * - 12:00 PM - 4:59 PM: "Good Afternoon" 🌤️
 * - 5:00 PM - 8:59 PM: "Good Evening" 🌆
 * - 9:00 PM - 3:59 AM: "Good Night" 🌙
 */
export const getGreeting = (): string => {
    const now = new Date();

    // Get IST time (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const istHours = istTime.getUTCHours();

    if (istHours >= 4 && istHours < 12) return "Good Morning";
    if (istHours >= 12 && istHours < 17) return "Good Afternoon";
    if (istHours >= 17 && istHours < 21) return "Good Evening";
    return "Good Night";
};

/**
 * Get current IST hour (0-23)
 */
export const getISTHour = (): number => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.getUTCHours();
};

/**
 * Check if two dates are the same day in IST
 */
export const isSameAppDay = (date1: Date, date2: Date): boolean => {
    const istOffset = 5.5 * 60 * 60 * 1000;

    const ist1 = new Date(date1.getTime() + istOffset);
    const ist2 = new Date(date2.getTime() + istOffset);

    return ist1.toISOString().split("T")[0] === ist2.toISOString().split("T")[0];
};

/**
 * Get date string for a habit completion or reward
 * Uses standard midnight (12:00 AM) IST as day boundary
 */
export const getCompletionDate = (): string => {
    return getAppDate();
};

/**
 * Get current date and time in IST
 */
export const getISTDateTime = (): Date => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
};
