import { useEffect, useRef } from "react";
import { usePopupNotifications } from "@/contexts/NotificationContext";
import { useTodayCompletions, useTodayReflection } from "@/hooks/useHabits";
import { useClaimedRewards } from "@/hooks/useCoins";
import { useUserStats, useAchievements, useUserAchievements } from "@/hooks/useAchievements";

/**
 * Hook that monitors for claimable rewards and sends popup notifications
 */
// Track what we've already notified about in this session (persists across unmounts/remounts)
const notifiedSet = new Set<string>();
let lastNotificationDate = new Date().toDateString();

/**
 * Hook that monitors for claimable rewards and sends popup notifications
 */
export const useRewardNotifications = () => {
    const { showNotification } = usePopupNotifications();
    const { data: todayCompletions = [] } = useTodayCompletions();
    const { data: todayReflection } = useTodayReflection();
    const { data: claimedRewards = [], isLoading: isClaimedLoading } = useClaimedRewards();
    const { data: stats } = useUserStats();
    const { data: achievements = [] } = useAchievements();
    const { data: userAchievements = [] } = useUserAchievements();

    const hasCompletedHabitToday = todayCompletions.length > 0;
    const hasWrittenReflectionToday = !!todayReflection;
    const claimedIds = new Set(claimedRewards.map((cr) => cr.reward_id));
    const earnedIds = new Set(userAchievements.map((ua) => ua.achievement_id));

    useEffect(() => {
        // Reset notifications if day changes
        const today = new Date().toDateString();
        if (today !== lastNotificationDate) {
            notifiedSet.clear();
            lastNotificationDate = today;
        }

        // Don't show notifications while loading claimed rewards
        if (isClaimedLoading) return;

        // Daily Login Quest
        if (!claimedIds.has("quest-login") && !notifiedSet.has("quest-login")) {
            showNotification({
                type: "reward",
                title: "🔑 Daily Login Reward",
                message: "Welcome back! Claim your 5 B Coins for logging in today.",
                route: "/inbox",
                duration: 3000,
            });
            notifiedSet.add("quest-login");
        }

        // Habit Completion Quest
        if (
            hasCompletedHabitToday &&
            !claimedIds.has("quest-habit") &&
            !notifiedSet.has("quest-habit")
        ) {
            showNotification({
                type: "reward",
                title: "✅ Habit Completed!",
                message: "Great job! Claim your 10 B Coins for completing a habit.",
                route: "/inbox",
                duration: 3000,
            });
            notifiedSet.add("quest-habit");
        }

        // Reflection Quest
        if (
            hasWrittenReflectionToday &&
            !claimedIds.has("quest-reflection") &&
            !notifiedSet.has("quest-reflection")
        ) {
            showNotification({
                type: "reward",
                title: "📝 Reflection Bonus",
                message: "Thoughtful! Claim your 5 B Coins for writing a reflection.",
                route: "/inbox",
                duration: 3000,
            });
            notifiedSet.add("quest-reflection");
        }

        // Check for unclaimed achievements
        if (achievements && stats) {
            achievements.forEach((achievement) => {
                const notifKey = `achievement-${achievement.id}`;

                // Skip if already earned or already notified
                if (earnedIds.has(achievement.id) || notifiedSet.has(notifKey)) {
                    return;
                }

                let qualifies = false;

                // Check if user qualifies for this achievement
                switch (achievement.requirement_type) {
                    case "total_habits":
                        qualifies = (stats.totalHabits || 0) >= achievement.requirement_value;
                        break;
                    case "total_completions":
                        qualifies = (stats.totalCompletions || 0) >= achievement.requirement_value;
                        break;
                    case "total_reflections":
                        qualifies = (stats.totalReflections || 0) >= achievement.requirement_value;
                        break;
                    case "streak":
                        qualifies = (stats.bestStreak || 0) >= achievement.requirement_value;
                        break;
                }

                if (qualifies) {
                    showNotification({
                        type: "achievement",
                        title: `🏆 ${achievement.name}`,
                        message: `You've unlocked a new achievement! Claim ${achievement.coin_reward} A Coins.`,
                        route: "/achievements",
                        duration: 3000,
                    });
                    notifiedSet.add(notifKey);
                }
            });
        }
    }, [
        hasCompletedHabitToday,
        hasWrittenReflectionToday,
        claimedIds,
        earnedIds,
        achievements,
        stats,
        showNotification,
        isClaimedLoading
    ]);
};
