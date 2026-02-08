import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trash2, Archive, ArchiveRestore, MoreHorizontal, TrendingUp, Target, Zap } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { subDays, format } from "date-fns";
import { useHabits, useAllCompletions, useDeleteHabit } from "@/hooks/useHabits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AnalyticsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: completions = [] } = useAllCompletions();
  const deleteHabit = useDeleteHabit();

  // Also fetch archived habits
  const allHabitsQuery = useHabits();

  const totalHabitPoints = useMemo(() => {
    return completions.reduce((sum, c) => sum + c.effort_level, 0);
  }, [completions]);

  const habitPointsBreakdown = useMemo(() => {
    return habits.map((habit) => ({
      ...habit,
      points: completions
        .filter((c) => c.habit_id === habit.id)
        .reduce((sum, c) => sum + c.effort_level, 0),
    }));
  }, [habits, completions]);

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateString = format(date, "yyyy-MM-dd");
      const formattedDate = format(date, "MMM dd");
      const dailyCompletions = completions.filter((c) => c.completion_date === dateString);
      const score = dailyCompletions.reduce((acc, curr) => acc + curr.effort_level, 0);
      data.push({ date: formattedDate, score });
    }
    return data;
  }, [completions]);

  const handleArchiveToggle = async (habitId: string) => {
    const { error } = await supabase
      .from("habits")
      .update({ is_archived: true })
      .eq("id", habitId);
    if (error) {
      toast.error("Failed to archive habit");
    } else {
      toast.success("Habit archived");
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    }
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
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Deep insights into your habit data</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Habits", value: habits.length, icon: Target, gradient: "gradient-primary" },
          { label: "Total Habit Points", value: totalHabitPoints, icon: Zap, gradient: "gradient-success" },
          { label: "Total Completions", value: completions.length, icon: TrendingUp, gradient: "gradient-hero" },
        ].map((stat) => (
          <motion.div key={stat.label} whileHover={{ y: -2 }}>
            <Card className="glass border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Points Breakdown */}
      {habitPointsBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Habit Points Breakdown</CardTitle>
              <CardDescription>Points earned per habit from effort levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {habitPointsBreakdown.map((habit, index) => (
                <div key={habit.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-8 rounded-md flex items-center justify-center text-foreground font-bold text-sm ${
                        index % 2 === 0 ? "bg-warning" : "bg-primary"
                      }`}
                    >
                      {habit.points}
                    </div>
                    <span className="text-muted-foreground">{habit.icon} {habit.name}</span>
                  </div>
                  <span className="font-semibold">{habit.points} pts</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weekly Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Daily Habit Score</CardTitle>
            <CardDescription>Your combined effort score over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" />
                <XAxis dataKey="date" stroke="hsl(240, 5%, 64.9%)" fontSize={12} />
                <YAxis stroke="hsl(240, 5%, 64.9%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(240, 10%, 6%)",
                    border: "1px solid hsl(240, 3.7%, 15.9%)",
                    borderRadius: "8px",
                    color: "hsl(0, 0%, 98%)",
                  }}
                  formatter={(value: number) => [`${value} pts`, "Score"]}
                />
                <Area type="monotone" dataKey="score" stroke="hsl(262, 83%, 58%)" fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Manage Habits Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Manage Habits</CardTitle>
            <CardDescription>Edit or remove your current habits.</CardDescription>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No habits yet. Create one from the Dashboard!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Habit</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {habitPointsBreakdown.map((habit) => (
                    <TableRow key={habit.id}>
                      <TableCell className="flex items-center gap-2">
                        <span>{habit.icon}</span>
                        <span>{habit.name}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{habit.points}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleArchiveToggle(habit.id)}>
                              <Archive className="mr-2 h-4 w-4" />
                              <span>Archive</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                if (confirm("Delete this habit and all its records?")) {
                                  deleteHabit.mutate(habit.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;
