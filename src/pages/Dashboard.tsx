import { useMemo } from "react";
import { useHabits, useTodayCompletions, useWeekCompletions, useLogEffort, useDeleteHabit } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useAchievements";
import { useAuth } from "@/components/AuthProvider";
import StatsCards from "@/components/dashboard/StatsCards";
import HabitCard from "@/components/dashboard/HabitCard";
import AIReflection from "@/components/dashboard/AIReflection";
import AddHabitDialog from "@/components/AddHabitDialog";
import { getGreeting } from "@/lib/dateUtils";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: todayCompletions = [] } = useTodayCompletions();
  const { data: weekCompletions = [] } = useWeekCompletions();
  const { data: userStats } = useUserStats();
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
        currentStreak={userStats?.bestStreak || 0}
        cycleScore={completedCount}
        improvement={completionRate > 0 ? completionRate - 50 : 0}
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
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  weekCompletions={weekCompletions}
                  todayCompletion={todayCompletions.find((c) => c.habit_id === habit.id)}
                  onLogEffort={(habitId, level) => logEffort.mutate({ habitId, effortLevel: level })}
                  onDelete={(habitId) => deleteHabit.mutate(habitId)}
                />
              ))}
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
