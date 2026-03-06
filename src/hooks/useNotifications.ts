import { useMemo } from "react";
import { useTodayCompletions, useHabits, useTodayReflection } from "@/hooks/useHabits";
import { useUserStats, useAchievements, useUserAchievements } from "@/hooks/useAchievements";
import { useClaimedRewards, useCycleStreakRewards } from "@/hooks/useCoins";
import { useReminders } from "@/hooks/useReminders";
import { format } from "date-fns";
import { useProfile } from "@/hooks/useProfile";
import { getCycleStartDate } from "@/lib/dateUtils";
import { useAuth } from "@/components/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { data: todayReflection } = useTodayReflection();
  const { data: stats } = useUserStats();
  const { data: achievements = [] } = useAchievements();
  const { data: userAchievements = [] } = useUserAchievements();
  const { data: claimedRewards = [] } = useClaimedRewards();
  const { data: cycleStreakRewards = [] } = useCycleStreakRewards();
  const { data: profile } = useProfile();
  const { reminders } = useReminders();
  const { user } = useAuth();

  // Check if user sent any community message today
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: todayCommunityMessages = [] } = useQuery({
    queryKey: ["today-community-activity-notifs", user?.id, todayStr],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("community_messages" as any)
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", `${todayStr}T00:00:00`)
        .lte("created_at", `${todayStr}T23:59:59`);
      return data || [];
    },
    enabled: !!user,
  });

  const hasCompletedHabitToday = todayCompletions.length > 0;
  const hasWrittenReflectionToday = !!todayReflection;
  const hasCommunityActivityToday = todayCommunityMessages.length > 0;
  const currentStreak = stats?.currentStreak || 0;
  const bestStreak = stats?.bestStreak || 0;
  const earnedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
  const claimedIds = new Set(claimedRewards.map((cr) => cr.reward_id));
  const claimedCycleStreakIds = new Set(cycleStreakRewards.map((cr) => cr.reward_id));

  const accountCreatedAt = (profile as any)?.created_at;
  const cycleNumber = useMemo(() => {
    if (!accountCreatedAt) return 0;
    const created = new Date(accountCreatedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(Math.max(0, diffDays) / 28);
  }, [accountCreatedAt]);

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
    if (hasWrittenReflectionToday && !claimedIds.has("quest-reflection")) {
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

    // Community quest - only show if not claimed
    if (hasCommunityActivityToday && !claimedIds.has("quest-community")) {
      notifs.push({
        id: "quest-community",
        type: "quest",
        title: "Community Bonus",
        description: "Thanks for engaging!",
        icon: "👥",
        claimable: true,
        claimReward: 8,
        timestamp: now,
      });
    }

    // Streak milestones
    const milestones = [
      { days: 3, reward: 3, label: "3-Day Streak" },
      { days: 7, reward: 7, label: "7-Day Streak" },
      { days: 15, reward: 15, label: "15-Day Streak" },
      { days: 28, reward: 28, label: "28-Day Streak" },
    ];

    milestones.forEach((m) => {
      const streakId = `streak-${m.days}-cycle-${cycleNumber}`;
      if (currentStreak >= m.days && !claimedCycleStreakIds.has(streakId)) {
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
        if (ach.requirement_type === "streak" && bestStreak >= ach.requirement_value) qualifies = true;
        if (ach.requirement_type === "total_completions" && (stats?.totalCompletions || 0) >= ach.requirement_value) qualifies = true;
        if (ach.requirement_type === "total_habits" && (stats?.totalHabits || 0) >= ach.requirement_value) qualifies = true;
        if (ach.requirement_type === "total_reflections" && (stats?.totalReflections || 0) >= ach.requirement_value) qualifies = true;

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

    // Reminders for today
    const todayStr = format(now, "yyyy-MM-dd");
    const todayReminders = reminders.filter(r => r.date === todayStr && !r.completed);

    todayReminders.forEach((r) => {
      notifs.push({
        id: r.id,
        type: "reminder",
        title: r.isSpecial ? "🎉 Special Event Today" : "🔔 Reminder",
        description: `${r.title} at ${r.time}`,
        icon: r.isSpecial ? "🎉" : "🔔",
        claimable: false,
        timestamp: new Date(`${r.date}T${r.time}`),
      });
    });

    return notifs;
  }, [todayCompletions, habits, stats, achievements, userAchievements, hasCompletedHabitToday, hasCommunityActivityToday, currentStreak, bestStreak, earnedIds, claimedIds, claimedCycleStreakIds, cycleNumber, reminders]);

  const claimableCount = notifications.filter((n) => n.claimable).length;

  return { notifications, claimableCount };
};
