import { useMemo } from "react";
import { useHabits, useTodayCompletions, useWeekCompletions, useLogEffort, useDeleteHabit } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useAchievements";
import { useAuth } from "@/components/AuthProvider";
import StatsCards from "@/components/dashboard/StatsCards";
import HabitCard from "@/components/dashboard/HabitCard";
import AIReflection from "@/components/dashboard/AIReflection";
import AddHabitDialog from "@/components/AddHabitDialog";
import { getGreeting, getAppDate, getCycleStartDate, formatLocalISODate } from "@/lib/dateUtils";
import { useProfile } from "@/hooks/useProfile";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: todayCompletions = [] } = useTodayCompletions();
  const { data: weekCompletions = [] } = useWeekCompletions();
  const { data: userStats } = useUserStats();
  const { data: profile } = useProfile();
  const logEffort = useLogEffort();
  const deleteHabit = useDeleteHabit();

  const completedIds = useMemo(
    () => new Set(todayCompletions.map((c) => c.habit_id)),
    [todayCompletions]
  );

  const completedCount = habits.filter((h) => completedIds.has(h.id)).length;
  const completionRate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  const todayScore = useMemo(() => {
    return todayCompletions.reduce((sum, c) => sum + (c.effort_level || 0), 0);
  }, [todayCompletions]);

  const improvement = useMemo(() => {
    if (habits.length === 0) return 0;

    // 1. Calculate the user's journey day
    let journeyDay = 1;
    if (profile?.created_at) {
      const istOffset = 5.5 * 60 * 60 * 1000;
      const createdAtIst = new Date(new Date(profile.created_at).getTime() + istOffset);
      const createdStr = createdAtIst.toISOString().split("T")[0];
      const createdAt = new Date(createdStr + "T00:00:00");
      const today = new Date(getAppDate() + "T00:00:00");
      const diffMs = today.getTime() - createdAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      journeyDay = diffDays >= 0 ? diffDays + 1 : 1;
    }

    // 2. Derive Current vs Previous Week
    const currentWeekIndex = Math.min(Math.floor((journeyDay - 1) / 7), 3); // 0 to 3 limit
    const previousWeekIndex = currentWeekIndex - 1;
    const daysInCurrentWeek = Math.min(Math.max(1, journeyDay - (currentWeekIndex * 7)), 7);

    const cycleStart = getCycleStartDate(profile?.created_at);

    const currentWeekStartDate = new Date(cycleStart.getTime());
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() + (currentWeekIndex * 7));
    const currentWeekStartStr = formatLocalISODate(currentWeekStartDate);

    const currentWeekEndDate = new Date(currentWeekStartDate.getTime());
    currentWeekEndDate.setDate(currentWeekEndDate.getDate() + 6);
    const currentWeekEndStr = formatLocalISODate(currentWeekEndDate);

    let previousWeekStartStr = "";
    let previousWeekEndStr = "";

    if (previousWeekIndex >= 0) {
      const prevWeekStartDate = new Date(cycleStart.getTime());
      prevWeekStartDate.setDate(prevWeekStartDate.getDate() + (previousWeekIndex * 7));
      previousWeekStartStr = formatLocalISODate(prevWeekStartDate);

      const prevWeekEndDate = new Date(prevWeekStartDate.getTime());
      prevWeekEndDate.setDate(prevWeekEndDate.getDate() + 6);
      previousWeekEndStr = formatLocalISODate(prevWeekEndDate);
    }

    let currentWeekScore = 0;
    let previousWeekScore = 0;

    weekCompletions.forEach((c) => {
      if (c.completion_date >= currentWeekStartStr && c.completion_date <= currentWeekEndStr) {
        currentWeekScore += (c.effort_level || 0);
      } else if (previousWeekIndex >= 0 && c.completion_date >= previousWeekStartStr && c.completion_date <= previousWeekEndStr) {
        previousWeekScore += (c.effort_level || 0);
      }
    });

    const maxDailyScore = habits.length * 4;

    // Calculate current pace: Out of max possible points over elapsed days of current week
    const currentRate = daysInCurrentWeek > 0 && maxDailyScore > 0 ? (currentWeekScore / (daysInCurrentWeek * maxDailyScore)) * 100 : 0;

    // To properly show pacing regressions, calculate what the previous week's score was *at this exact same point in the week*.
    const previousPaceTargetScore = previousWeekScore * (daysInCurrentWeek / 7);
    const previousRate = previousWeekIndex >= 0 && maxDailyScore > 0 ? (previousPaceTargetScore / (daysInCurrentWeek * maxDailyScore)) * 100 : 0;

    return Math.round(currentRate - previousRate);
  }, [weekCompletions, habits.length, profile?.created_at]);

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  if (habitsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <h1 className="text-3xl font-bold">
        {getGreeting()}, {userName.toUpperCase()}!
      </h1>

      {/* Stats */}
      <StatsCards
        todayScore={todayScore}
        currentStreak={userStats?.currentStreak || 0}
        cycleScore={completedCount}
        improvement={improvement}
      />

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Habits Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Today's Habits</h2>
            <AddHabitDialog />
          </div>

          {habits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 p-8 text-center">
              <p className="text-4xl mb-4">🎯</p>
              <p className="text-lg font-medium mb-2">No habits yet!</p>
              <p className="text-muted-foreground mb-4">Create your first habit to start tracking.</p>
              <AddHabitDialog />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {habits.map((habit) => {
                const todayCompletion = todayCompletions.find((c) => c.habit_id === habit.id);
                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    weekCompletions={weekCompletions}
                    todayCompletion={todayCompletion}
                    onLogEffort={(habitId, level) => logEffort.mutate({ habitId, effortLevel: level, isNew: !todayCompletion })}
                    onDelete={(habitId) => deleteHabit.mutate(habitId)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <AIReflection completionRate={completionRate} userName={userName} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
