import { useMemo } from "react";
import { useHabits, useTodayCompletions, useWeekCompletions, useLogEffort, useArchiveHabit } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useAchievements";
import { useAuth } from "@/components/AuthProvider";
import StatsCards from "@/components/dashboard/StatsCards";
import HabitCard from "@/components/dashboard/HabitCard";
import AIReflection from "@/components/dashboard/AIReflection";
import AddHabitDialog from "@/components/AddHabitDialog";
import { getGreeting, getAppDate, getCycleStartDate, formatLocalISODate } from "@/lib/dateUtils";
import { useProfile } from "@/hooks/useProfile";
import { useCommunities } from "@/hooks/useCommunities";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Bell, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";


const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: todayCompletions = [] } = useTodayCompletions();
  const { data: weekCompletions = [] } = useWeekCompletions();
  const { data: userStats } = useUserStats();
  const { data: profile } = useProfile();
  const logEffort = useLogEffort();
  const archiveHabit = useArchiveHabit();

  // Check for pending join requests across communities the user administers
  const { myMemberships } = useCommunities();
  const adminCommunityIds = myMemberships
    .filter((m: any) => m.role === 'admin' || m.role === 'moderator')
    .map((m: any) => m.community_id);

  const { data: totalPendingRequests = 0 } = useQuery({
    queryKey: ["all-pending-join-requests", adminCommunityIds.join(",")],
    queryFn: async () => {
      if (adminCommunityIds.length === 0) return 0;
      const { count } = await supabase
        .from("community_join_requests" as any)
        .select("id", { count: "exact", head: true })
        .in("community_id", adminCommunityIds)
        .eq("status", "pending");
      return count || 0;
    },
    enabled: adminCommunityIds.length > 0,
    refetchInterval: 30_000, // Poll every 30s
  });

  const completedIds = useMemo(
    () => new Set(todayCompletions.map((c) => c.habit_id)),
    [todayCompletions]
  );

  const completedCount = habits.filter((h) => completedIds.has(h.id)).length;
  const completionRate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  const todayScore = useMemo(() => {
    const activeIds = new Set(habits.map(h => h.id)); // habits from useHabits() are already active-only
    return todayCompletions
      .filter(c => activeIds.has(c.habit_id))
      .reduce((sum, c) => sum + (c.effort_level || 0), 0);
  }, [todayCompletions, habits]);

  // ─── Cycle week metadata (all anchored to account creation date) ───────────
  // Returns the date strings for the current and previous cycle weeks,
  // plus how many days have elapsed in the current week.
  const cycleData = useMemo(() => {
    const cycleStart = getCycleStartDate(profile?.created_at);
    const todayStr = getAppDate();
    const today = new Date(todayStr + "T00:00:00");

    const diffDays = Math.floor(
      (today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekIndex = Math.min(Math.floor(Math.max(0, diffDays) / 7), 3); // 0–3
    const dayInWeek = diffDays - weekIndex * 7; // 0–6

    // Current cycle week dates (e.g. Feb 28 – Mar 6 for Week 3)
    const currWeekStart = new Date(cycleStart);
    currWeekStart.setDate(currWeekStart.getDate() + weekIndex * 7);
    const cycleWeekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currWeekStart);
      d.setDate(d.getDate() + i);
      return formatLocalISODate(d);
    });

    // Previous cycle week dates (empty array if we're in Week 1)
    let prevCycleWeekDates: string[] = [];
    if (weekIndex > 0) {
      const prevWeekStart = new Date(cycleStart);
      prevWeekStart.setDate(prevWeekStart.getDate() + (weekIndex - 1) * 7);
      prevCycleWeekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(prevWeekStart);
        d.setDate(d.getDate() + i);
        return formatLocalISODate(d);
      });
    }

    // Days elapsed in current week (at least 1 to avoid ÷0)
    const daysElapsedInWeek = Math.max(1, dayInWeek + 1);

    // Cycle day: which day of the 28-day cycle are we on (1-indexed, capped at 28)
    const cycleDay = Math.min(Math.max(1, diffDays + 1), 28);

    return { cycleWeekDates, prevCycleWeekDates, daysElapsedInWeek, cycleDay };
  }, [profile?.created_at]);

  // ─── Overall improvement = average of per-habit cycle-week improvement ─────
  // Compares current cycle week (paced by days elapsed) vs previous cycle week (full 7 days).
  // This matches exactly what ImprovementDialog and the HabitCard badge show.
  const improvement = useMemo(() => {
    if (habits.length === 0) return 0;

    const { cycleWeekDates, prevCycleWeekDates, daysElapsedInWeek } = cycleData;
    const currSet = new Set(cycleWeekDates);
    const prevSet = new Set(prevCycleWeekDates);

    let totalImprovement = 0;

    habits.forEach((habit) => {
      let currScore = 0;
      let prevScore = 0;

      weekCompletions.forEach((c) => {
        if (c.habit_id !== habit.id) return;
        if (currSet.has(c.completion_date)) currScore += c.effort_level || 0;
        else if (prevSet.has(c.completion_date)) prevScore += c.effort_level || 0;
      });

      // Paced rate: current score / (days elapsed × max effort 4)
      const currRate = (currScore / (daysElapsedInWeek * 4)) * 100;
      // Full rate for previous week (7 days × 4)
      const prevRate = prevCycleWeekDates.length > 0 ? (prevScore / (7 * 4)) * 100 : 0;

      totalImprovement += Math.round(currRate - prevRate);
    });

    return habits.length > 0 ? Math.round(totalImprovement / habits.length) : 0;
  }, [weekCompletions, habits, cycleData]);

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
      {/* Join Request Alert for admins */}
      {totalPendingRequests > 0 && (
        <div
          onClick={() => navigate('/community')}
          className="cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              You have <span className="text-yellow-500">{totalPendingRequests}</span> pending community join request{totalPendingRequests !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">Click to go to the Community Hub and respond</p>
          </div>
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {/* Greeting */}
      <h1 className="text-3xl font-bold">
        {getGreeting()}, {userName.toUpperCase()}!
      </h1>

      {/* Stats */}
      <StatsCards
        todayScore={todayScore}
        currentStreak={userStats?.currentStreak || 0}
        cycleDay={cycleData.cycleDay}
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
                    cycleWeekDates={cycleData.cycleWeekDates}
                    prevCycleWeekDates={cycleData.prevCycleWeekDates}
                    daysElapsedInWeek={cycleData.daysElapsedInWeek}
                    onLogEffort={(habitId, level) => logEffort.mutate({ habitId, effortLevel: level, isNew: !todayCompletion })}
                    onArchive={(habitId) => archiveHabit.mutate(habitId)}
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
