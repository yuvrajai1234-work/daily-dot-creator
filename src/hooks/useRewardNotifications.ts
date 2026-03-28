import { useEffect, useRef } from "react";
import { usePopupNotifications } from "@/contexts/NotificationContext";
import { useTodayCompletions } from "@/hooks/useHabits";
import { useClaimedRewards } from "@/hooks/useCoins";
import { useUserStats, useAchievements, useUserAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/components/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAppDate } from "@/lib/dateUtils";
import {
    sendRewardNotification,
    sendAchievementNotification,
    sendStreakNotification,
} from "@/lib/deviceNotifications";
import { provideFeedback } from "@/lib/feedback";
import { useTheme } from "@/contexts/ThemeContext";

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
    const { settings } = useTheme();
    const { data: todayCompletions = [] } = useTodayCompletions();
    const { data: claimedRewards = [], isLoading: isClaimedLoading } = useClaimedRewards();
    const { data: stats } = useUserStats();
    const { data: achievements = [] } = useAchievements();
    const { data: userAchievements = [] } = useUserAchievements();
    const { user } = useAuth();

    // Check if user sent any community message today (IST)
    const todayStr = getAppDate();
    const { data: todayCommunityMessages = [] } = useQuery({
        queryKey: ["today-community-activity-notifs", user?.id, todayStr],
        queryFn: async () => {
            if (!user) return [];
            const { data } = await supabase
                .from("community_messages" as any)
                .select("id")
                .eq("user_id", user.id)
                .gte("created_at", `${todayStr}T00:00:00+05:30`)
                .lte("created_at", `${todayStr}T23:59:59+05:30`);
            return data || [];
        },
        enabled: !!user,
    });

    const hasCompletedHabitToday = todayCompletions.length > 0;
    const hasCommunityActivityToday = todayCommunityMessages.length > 0;
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
            sendRewardNotification("🔑 Daily Login Reward", "Welcome back! Claim your 5 B Coins for logging in today.");
            provideFeedback('success', settings);
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
            sendRewardNotification("✅ Habit Completed!", "Great job! Claim your 10 B Coins for completing a habit.");
            provideFeedback('complete', settings);
            notifiedSet.add("quest-habit");
        }

        // Community Quest
        if (
            hasCommunityActivityToday &&
            !claimedIds.has("quest-community") &&
            !notifiedSet.has("quest-community")
        ) {
            showNotification({
                type: "reward",
                title: "👥 Community Bonus",
                message: "Thanks for engaging! Claim your 8 B Coins.",
                route: "/inbox",
                duration: 3000,
            });
            sendRewardNotification("👥 Community Bonus", "Thanks for engaging! Claim your 8 B Coins.");
            provideFeedback('success', settings);
            notifiedSet.add("quest-community");
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
                    sendAchievementNotification(achievement.name, achievement.coin_reward);
                    provideFeedback('achievement', settings);
                    notifiedSet.add(notifKey);
                }
            });
        }
    }, [
        hasCompletedHabitToday,
        hasCommunityActivityToday,
        claimedIds,
        earnedIds,
        achievements,
        stats,
        showNotification,
        isClaimedLoading
    ]);
};
