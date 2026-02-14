import { useUserStats } from "@/hooks/useAchievements";
import { useTodayCompletions, useHabits } from "@/hooks/useHabits";

interface DailyStats {
    habitsCompletedToday: number;
    totalHabits: number;
    currentStreak: number;
    totalCompletions: number;
    totalReflections: number;
    completionRate: number;
}

interface AIMessage {
    greeting: string;
    analysis: string;
    advice: string;
    motivation: string;
    emoji: string;
}

export const useAIReflection = () => {
    const { data: stats } = useUserStats();
    const { data: todayCompletions = [] } = useTodayCompletions();
    const { data: habits = [] } = useHabits();

    const getDailyStats = (): DailyStats => {
        const habitsCompletedToday = todayCompletions.length;
        const totalHabits = habits.filter(h => !h.is_archived).length;
        const currentStreak = stats?.bestStreak || 0;
        const totalCompletions = stats?.totalCompletions || 0;
        const totalReflections = stats?.totalReflections || 0;
        const completionRate = totalHabits > 0 ? (habitsCompletedToday / totalHabits) * 100 : 0;

        return {
            habitsCompletedToday,
            totalHabits,
            currentStreak,
            totalCompletions,
            totalReflections,
            completionRate,
        };
    };

    const generateAIMessage = (): AIMessage => {
        const stats = getDailyStats();

        // Perfect day - all habits completed
        if (stats.completionRate === 100 && stats.totalHabits > 0) {
            return {
                greeting: "Outstanding work!",
                analysis: `You've completed all ${stats.totalHabits} habits today! This is the kind of dedication that builds lasting change.`,
                advice: "Keep this momentum going. Consider adding a new, slightly challenging habit to continue growing.",
                motivation: "You're not just building habits—you're building a better version of yourself. Keep shining! ✨",
                emoji: "🎉",
            };
        }

        // Good progress - 70%+ completion
        if (stats.completionRate >= 70 && stats.totalHabits > 0) {
            return {
                greeting: "Great progress today!",
                analysis: `You've completed ${stats.habitsCompletedToday} out of ${stats.totalHabits} habits (${Math.round(stats.completionRate)}%). That's solid consistency!`,
                advice: "You're so close to a perfect day. Try to squeeze in those remaining habits before bedtime.",
                motivation: "Every habit you complete is a vote for the person you want to become. You're winning! 💪",
                emoji: "⭐",
            };
        }

        // Moderate progress - 40-69%
        if (stats.completionRate >= 40 && stats.totalHabits > 0) {
            return {
                greeting: "You're making progress!",
                analysis: `You've completed ${stats.habitsCompletedToday} out of ${stats.totalHabits} habits. There's still time to do more!`,
                advice: "Pick one more habit to complete right now. Small wins add up to big transformations.",
                motivation: "Don't let perfect be the enemy of good. Every step forward counts! 🌟",
                emoji: "💫",
            };
        }

        // Slow start - under 40% or no habits done
        if (stats.totalHabits > 0) {
            return {
                greeting: "Let's get moving!",
                analysis: stats.habitsCompletedToday === 0
                    ? "You haven't checked off any habits yet today. The day is still young!"
                    : `You've completed ${stats.habitsCompletedToday} out of ${stats.totalHabits} habits. You can do more!`,
                advice: "Start with the easiest habit on your list. Just one check mark can create momentum for the rest.",
                motivation: "The best time to start was this morning. The second best time is right now! 🚀",
                emoji: "🔥",
            };
        }

        // Long streak celebration
        if (stats.currentStreak >= 7) {
            return {
                greeting: "Streak champion!",
                analysis: `You're on a ${stats.currentStreak}-day streak! This consistency is building real change in your life.`,
                advice: "Don't break the chain now. Set a reminder to complete your habits before bed.",
                motivation: "Consistency isn't perfection—it's showing up day after day. You're proving you can do hard things! 🔥",
                emoji: "🏆",
            };
        }

        // New user or no habits set up
        return {
            greeting: "Welcome to your journey!",
            analysis: "It looks like you're just getting started. Setting up good habits is the first step to greatness.",
            advice: "Create 2-3 small, achievable habits to track. Start simple: drink water, take a walk, write 1 sentence.",
            motivation: "Every expert was once a beginner. Your future self will thank you for starting today! 🌱",
            emoji: "✨",
        };
    };

    return {
        getDailyStats,
        generateAIMessage,
    };
};
