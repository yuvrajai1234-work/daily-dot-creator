import { useMemo } from "react";
import { useTodayCompletions, useHabits } from "@/hooks/useHabits";
import { useUserStats, useAchievements, useUserAchievements } from "@/hooks/useAchievements";
import { useClaimedRewards } from "@/hooks/useCoins";

export interface AppNotification {
  id: string;
  type: "quest" | "streak" | "achievement" | "reward" | "reminder";
  title: string;
  description: string;
  icon: string;
  claimable: boolean;
  claimReward?: number;
  timestamp: Date;
}

export const useNotifications = () => {
  const { data: todayCompletions = [] } = useTodayCompletions();
  const { data: habits = [] } = useHabits();
  const { data: stats } = useUserStats();
  const { data: achievements = [] } = useAchievements();
  const { data: userAchievements = [] } = useUserAchievements();
  const { data: claimedRewards = [] } = useClaimedRewards();

  const hasCompletedHabitToday = todayCompletions.length > 0;
  const currentStreak = stats?.bestStreak || 0;
  const earnedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
  const claimedIds = new Set(claimedRewards.map((cr) => cr.reward_id));

  const notifications = useMemo<AppNotification[]>(() => {
    const notifs: AppNotification[] = [];
    const now = new Date();

    // Daily login quest - only show if not claimed
    if (!claimedIds.has("quest-login")) {
      notifs.push({
        id: "quest-login",
        type: "quest",
        title: "Daily Login Reward",
        description: "You logged in today! Claim your coins.",
        icon: "🔑",
        claimable: true,
        claimReward: 5,
        timestamp: now,
      });
    }

    // Habit completion quest - only show if not claimed
    if (hasCompletedHabitToday && !claimedIds.has("quest-habit")) {
      notifs.push({
        id: "quest-habit",
        type: "quest",
        title: "Habit Check-in Complete",
        description: "You completed a habit today!",
        icon: "✅",
        claimable: true,
        claimReward: 10,
        timestamp: now,
      });
    }

    // Reflection quest - only show if not claimed
    if ((stats?.totalReflections || 0) > 0 && !claimedIds.has("quest-reflection")) {
      notifs.push({
        id: "quest-reflection",
        type: "quest",
        title: "Reflection Written",
        description: "You wrote a daily reflection!",
        icon: "📝",
        claimable: true,
        claimReward: 5,
        timestamp: now,
      });
    }

    // Streak milestones
    const milestones = [
      { days: 3, reward: 5, label: "3-Day Streak" },
      { days: 7, reward: 10, label: "7-Day Streak" },
      { days: 15, reward: 25, label: "15-Day Streak" },
      { days: 30, reward: 50, label: "30-Day Streak" },
    ];

    milestones.forEach((m) => {
      const streakId = `streak-${m.days}`;
      if (currentStreak >= m.days && !claimedIds.has(streakId)) {
        notifs.push({
          id: streakId,
          type: "streak",
          title: `${m.label} Achieved! 🔥`,
          description: `Maintain ${m.days} days — claim your bonus!`,
          icon: "🔥",
          claimable: true,
          claimReward: m.reward,
          timestamp: now,
        });
      }
    });

    // Unclaimed achievements
    achievements.forEach((ach) => {
      if (!earnedIds.has(ach.id)) {
        // Check if user qualifies
        let qualifies = false;
        if (ach.requirement_type === "streak" && currentStreak >= ach.requirement_value) qualifies = true;
        if (ach.requirement_type === "completions" && (stats?.totalCompletions || 0) >= ach.requirement_value) qualifies = true;
        if (ach.requirement_type === "habits" && (stats?.totalHabits || 0) >= ach.requirement_value) qualifies = true;
        if (ach.requirement_type === "reflections" && (stats?.totalReflections || 0) >= ach.requirement_value) qualifies = true;

        if (qualifies) {
          notifs.push({
            id: `achievement-${ach.id}`,
            type: "achievement",
            title: `Achievement: ${ach.name}`,
            description: ach.description,
            icon: ach.icon,
            claimable: true,
            claimReward: ach.coin_reward,
            timestamp: now,
          });
        }
      }
    });

    // Reminders for incomplete habits
    const incompleteCount = habits.length - todayCompletions.length;
    if (incompleteCount > 0 && habits.length > 0) {
      notifs.push({
        id: "reminder-habits",
        type: "reminder",
        title: "Habits Remaining",
        description: `You have ${incompleteCount} habit${incompleteCount > 1 ? "s" : ""} left for today.`,
        icon: "⏰",
        claimable: false,
        timestamp: now,
      });
    }

    return notifs;
  }, [todayCompletions, habits, stats, achievements, userAchievements, hasCompletedHabitToday, currentStreak, earnedIds, claimedIds]);

  const claimableCount = notifications.filter((n) => n.claimable).length;

  return { notifications, claimableCount };
};
