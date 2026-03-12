import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trash2, Archive, ArchiveRestore, MoreHorizontal, TrendingUp, Target, Zap, AlertTriangle, Coins } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { useHabits, useAllCompletions, useDeleteHabit, useArchivedHabits, useUnarchiveHabit, useArchiveHabit } from "@/hooks/useHabits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { getCycleStartDate, formatLocalISODate } from "@/lib/dateUtils";

const AnalyticsPage = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: completions = [] } = useAllCompletions();
  const deleteHabit = useDeleteHabit();
  const { data: archivedHabits = [] } = useArchivedHabits();
  const unarchiveHabit = useUnarchiveHabit();
  const archiveHabit = useArchiveHabit();

  // Track which archived habit is pending permanent deletion (for AlertDialog)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteHabit = archivedHabits.find(h => h.id === pendingDeleteId);

  const habitPointsBreakdown = useMemo(() => {
    return habits.map((habit) => ({
      ...habit,
      points: completions
        .filter((c) => c.habit_id === habit.id)
        .reduce((sum, c) => sum + c.effort_level, 0),
    })).sort((a, b) => b.points - a.points); // Sort by highest points
  }, [habits, completions]);

  const chartData = useMemo(() => {
    const data = [];
    const cycleStart = getCycleStartDate(profile?.created_at);

    for (let i = 0; i < 28; i++) {
      const dateObj = new Date(cycleStart.getTime());
      dateObj.setDate(dateObj.getDate() + i);
      const dateString = formatLocalISODate(dateObj);
      const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const dailyCompletions = completions.filter((c) => c.completion_date === dateString);
      const score = dailyCompletions.reduce((acc, curr) => acc + curr.effort_level, 0);
      data.push({ date: formattedDate, score });
    }
    return data;
  }, [completions, profile?.created_at]);

  const handleArchiveToggle = async (habitId: string) => {
    archiveHabit.mutate(habitId);
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
          { label: "Total Habit Points", value: habitPointsBreakdown.reduce((sum, h) => sum + h.points, 0), icon: Zap, gradient: "gradient-success" },
          { label: "Total Completions", value: habitPointsBreakdown.reduce((sum, h) => sum + completions.filter(c => c.habit_id === h.id).length, 0), icon: TrendingUp, gradient: "gradient-hero" },
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
                      className={`w-10 h-8 rounded-md flex items-center justify-center text-foreground font-bold text-sm ${index % 2 === 0 ? "bg-warning" : "bg-primary"
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
            <CardDescription>Your combined effort score over the last 28 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto custom-scrollbar pb-4">
              <div className="min-w-[800px] h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(240, 5%, 64.9%)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      minTickGap={0}
                      angle={-45}
                      textAnchor="end"
                      height={55}
                    />
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
              </div>
            </div>
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
                    <TableHead className="text-right">Completions</TableHead>
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
                      <TableCell className="text-right font-mono">
                        {completions.filter(c => c.habit_id === habit.id).length}
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
                            <DropdownMenuItem onSelect={() => handleArchiveToggle(habit.id)} disabled={archiveHabit.isPending}>
                              <Archive className="mr-2 h-4 w-4" />
                              <span className="flex-1">Move to Archive (Costs 50 B Coins)</span>
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

      {/* Archived & Past Habits */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Archived & Past Habits</CardTitle>
            <CardDescription>View and manage your archived habits.</CardDescription>
          </CardHeader>
          <CardContent>
            {archivedHabits.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No archived habits.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Habit</TableHead>
                    <TableHead className="text-right">Completions</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedHabits.map((habit) => {
                    const habitCompletions = completions.filter(c => c.habit_id === habit.id);
                    const totalCompletions = habitCompletions.length;
                    const totalPoints = habitCompletions.reduce((sum, c) => sum + c.effort_level, 0);

                    return (
                      <TableRow key={habit.id}>
                        <TableCell className="flex items-center gap-2">
                          <span>{habit.icon}</span>
                          <span className="text-muted-foreground">{habit.name}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{totalCompletions}</TableCell>
                        <TableCell className="text-right font-mono">{totalPoints}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => unarchiveHabit.mutate(habit.id)}>
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                <span>Unarchive</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setPendingDeleteId(habit.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Permanently</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Permanent Delete AlertDialog ── */}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
        <AlertDialogContent className="glass border-destructive/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Permanently Delete Habit?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                You are about to permanently delete{" "}
                <span className="font-semibold text-foreground">
                  {pendingDeleteHabit?.icon} {pendingDeleteHabit?.name}
                </span>.
              </p>
              <p className="text-destructive font-medium">
                ⚠️ This will erase ALL completion history, effort scores, and streak data for this habit. This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                if (pendingDeleteId) {
                  deleteHabit.mutate(pendingDeleteId);
                  setPendingDeleteId(null);
                }
              }}
            >
              Yes, Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnalyticsPage;
