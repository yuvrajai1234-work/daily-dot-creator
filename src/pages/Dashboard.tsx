import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, Flame, Trophy, TrendingUp, Check, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useHabits, useTodayCompletions, useWeekCompletions, useToggleCompletion, useDeleteHabit, useSaveReflection } from "@/hooks/useHabits";
import { useUserAchievements } from "@/hooks/useAchievements";
import AddHabitDialog from "@/components/AddHabitDialog";
import { useAuth } from "@/components/AuthProvider";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: todayCompletions = [] } = useTodayCompletions();
  const { data: weekCompletions = [] } = useWeekCompletions();
  const { data: userAchievements = [] } = useUserAchievements();
  const toggleCompletion = useToggleCompletion();
  const deleteHabit = useDeleteHabit();
  const saveReflection = useSaveReflection();
  const [reflection, setReflection] = useState("");

  const completedIds = useMemo(
    () => new Set(todayCompletions.map((c) => c.habit_id)),
    [todayCompletions]
  );

  const completedCount = habits.filter((h) => completedIds.has(h.id)).length;
  const completionRate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split("T")[0];
      const dayCompletions = weekCompletions.filter((c) => c.completion_date === dateStr);
      const rate = habits.length > 0 ? Math.round((dayCompletions.length / habits.length) * 100) : 0;
      return { day: days[date.getDay()], completion: Math.min(rate, 100) };
    });
  }, [weekCompletions, habits]);

  const handleToggle = (habitId: string) => {
    const isCompleted = completedIds.has(habitId);
    toggleCompletion.mutate({ habitId, isCompleted });
  };

  if (habitsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.user_metadata?.full_name || "there"}! Let's make today count.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Progress", value: `${completionRate}%`, icon: TrendingUp, gradient: "gradient-primary" },
          { label: "Completed", value: `${completedCount}/${habits.length}`, icon: Calendar, gradient: "gradient-success" },
          { label: "Total Habits", value: `${habits.length}`, icon: Flame, gradient: "bg-warning" },
          { label: "Achievements", value: `${userAchievements.length}`, icon: Trophy, gradient: "gradient-hero" },
        ].map((stat) => (
          <motion.div key={stat.label} whileHover={{ y: -2 }}>
            <Card className="glass border-border/50 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.gradient} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Habits */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Today's Habits</h2>
            <AddHabitDialog />
          </div>

          {habits.length === 0 ? (
            <Card className="glass border-border/50">
              <CardContent className="p-8 text-center">
                <p className="text-4xl mb-4">🎯</p>
                <p className="text-lg font-medium mb-2">No habits yet!</p>
                <p className="text-muted-foreground mb-4">Create your first habit to start tracking.</p>
                <AddHabitDialog />
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {habits.map((habit) => {
                const isCompleted = completedIds.has(habit.id);
                return (
                  <motion.div key={habit.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Card
                      className="cursor-pointer transition-smooth border-border/30 overflow-hidden relative group"
                      style={{
                        background: isCompleted
                          ? `linear-gradient(135deg, ${habit.color}, ${habit.color}88)`
                          : undefined,
                      }}
                      onClick={() => handleToggle(habit.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{habit.icon}</span>
                            <div>
                              <p className="font-medium">{habit.name}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Flame className="w-3 h-3 text-warning" />
                                <span className="text-xs text-muted-foreground">
                                  {isCompleted ? "Done today!" : "Tap to complete"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHabit.mutate(habit.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-smooth p-1 hover:bg-destructive/20 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-smooth ${
                                isCompleted
                                  ? "bg-foreground/20 border-foreground/40"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {isCompleted && <Check className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Weekly Chart */}
          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Weekly Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" />
                  <XAxis dataKey="day" stroke="hsl(240, 5%, 64.9%)" fontSize={12} />
                  <YAxis stroke="hsl(240, 5%, 64.9%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(240, 10%, 6%)",
                      border: "1px solid hsl(240, 3.7%, 15.9%)",
                      borderRadius: "8px",
                      color: "hsl(0, 0%, 98%)",
                    }}
                    formatter={(value: number) => [`${value}%`, "Completion"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="completion"
                    stroke="hsl(262, 83%, 58%)"
                    fillOpacity={1}
                    fill="url(#colorCompletion)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Reflection */}
          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Daily Reflection</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="How was your day? What did you learn?"
                className="min-h-[100px] bg-secondary/30 border-border resize-none"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
              />
              <Button
                className="w-full mt-3 gradient-primary hover:opacity-90"
                size="sm"
                disabled={!reflection.trim() || saveReflection.isPending}
                onClick={() => {
                  saveReflection.mutate(reflection, {
                    onSuccess: () => setReflection(""),
                  });
                }}
              >
                {saveReflection.isPending ? "Saving..." : "Save Reflection"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
