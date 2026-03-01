import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useHabits, useAllCompletions } from "@/hooks/useHabits";
import { getAppDate, getCycleStartDate, formatLocalISODate } from "@/lib/dateUtils";
import { useProfile } from "@/hooks/useProfile";

interface ImprovementDialogProps {
    trigger: React.ReactNode;
    overallImprovement: number;
    singleHabitId?: string;
}

export const ImprovementDialog = ({ trigger, overallImprovement, singleHabitId }: ImprovementDialogProps) => {
    const { data: allHabits = [] } = useHabits();
    const { data: allCompletions = [] } = useAllCompletions();

    // Filter to a single habit if singleHabitId is provided
    const habits = useMemo(() => {
        if (singleHabitId) {
            return allHabits.filter(h => h.id === singleHabitId);
        }
        return allHabits;
    }, [allHabits, singleHabitId]);

    const { data: profile } = useProfile();

    // Calculate which day of the journey the user is on
    const journeyDay = useMemo(() => {
        if (!profile?.created_at) return 1;
        const istOffset = 5.5 * 60 * 60 * 1000;
        const createdAtIst = new Date(new Date(profile.created_at).getTime() + istOffset);
        const createdStr = createdAtIst.toISOString().split("T")[0];
        const createdAt = new Date(createdStr + "T00:00:00");

        const today = new Date(getAppDate() + "T00:00:00");
        const diffMs = today.getTime() - createdAt.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays + 1 : 1;
    }, [profile?.created_at]);

    // Chart Data (Current 28-day cycle percentage)
    const monthlyData = useMemo(() => {
        const data = [];
        const cycleStart = getCycleStartDate(profile?.created_at);
        const maxDailyScore = habits.length > 0 ? habits.length * 4 : 4;

        for (let i = 0; i < 28; i++) {
            const dateObj = new Date(cycleStart.getTime());
            dateObj.setDate(dateObj.getDate() + i);
            const dateStr = formatLocalISODate(dateObj);

            // format dateStr (YYYY-MM-DD) to MMM D
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const dailyCompletions = allCompletions.filter(c => c.completion_date === dateStr);
            const score = dailyCompletions.reduce((sum, c) => sum + (c.effort_level || 0), 0);
            const percentage = habits.length > 0 ? Math.round((score / maxDailyScore) * 100) : 0;

            data.push({ date: formattedDate, percentage, score });
        }
        return data;
    }, [allCompletions, profile?.created_at, habits.length]);

    // Habit Weekly Stats
    const currentWeekIndex = Math.min(Math.floor((journeyDay - 1) / 7), 3); // week 0 to 3 limit
    const daysInCurrentWeek = Math.min(Math.max(1, journeyDay - (currentWeekIndex * 7)), 7);

    const weekStats = useMemo(() => {
        const cycleStart = getCycleStartDate(profile?.created_at);
        const previousWeekIndex = currentWeekIndex - 1;

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

        return habits.map(habit => {
            let currentScore = 0;
            let previousScore = 0;
            allCompletions.forEach(c => {
                if (c.habit_id !== habit.id) return;

                if (c.completion_date >= currentWeekStartStr && c.completion_date <= currentWeekEndStr) {
                    currentScore += (c.effort_level || 0);
                } else if (previousWeekIndex >= 0 && c.completion_date >= previousWeekStartStr && c.completion_date <= previousWeekEndStr) {
                    previousScore += (c.effort_level || 0);
                }
            });

            // Current week rate pacing is calculated by max score possible in elapsed days
            const currentRate = daysInCurrentWeek > 0 ? (currentScore / (daysInCurrentWeek * 4)) * 100 : 0;

            // Previous week rate is out of a full 7-day max score
            const previousRate = previousWeekIndex >= 0 ? (previousScore / (7 * 4)) * 100 : 0;
            const improvement = Math.round(currentRate - previousRate);

            const avg = daysInCurrentWeek > 0 ? (currentScore / daysInCurrentWeek).toFixed(1) : "0.0";

            return {
                ...habit,
                weekScore: currentScore,
                rate: Math.round(currentRate),
                improvement,
                avg
            };
        });
    }, [habits, allCompletions, profile?.created_at, currentWeekIndex, daysInCurrentWeek]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-3xl w-[90vw] max-h-[85vh] overflow-y-auto glass border-primary/20">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {singleHabitId && habits.length === 1 ? habits[0].name : "Improvement"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Top Card */}
                    <Card className="glass border-border/50">
                        <CardContent className="p-8 flex flex-col items-center justify-center space-y-2 relative">
                            <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary">
                                Day {journeyDay}
                            </span>
                            <h2 className="text-6xl font-bold">{overallImprovement >= 0 && overallImprovement !== 0 ? "+" : ""}{overallImprovement}%</h2>
                            <p className="text-muted-foreground">Improvement (From Last Week)</p>
                        </CardContent>
                    </Card>

                    {/* Monthly Improvement Chart */}
                    <Card className="glass border-border/50">
                        <CardHeader>
                            <CardTitle>Daily Percentage Improvement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" vertical={false} />
                                    <XAxis dataKey="date" stroke="hsl(240, 5%, 64.9%)" fontSize={12} tickLine={false} axisLine={false} minTickGap={20} />
                                    <YAxis stroke="hsl(240, 5%, 64.9%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                    <Tooltip
                                        contentStyle={{ background: "hsl(240, 10%, 6%)", border: "1px solid hsl(240, 3.7%, 15.9%)", borderRadius: "8px" }}
                                        formatter={(value: number) => [`${value}%`, "Improvement"]}
                                    />
                                    <Line type="stepAfter" dataKey="percentage" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Habit Weekly Stats */}
                    <Card className="glass border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Habit Week {currentWeekIndex + 1} Stats</CardTitle>
                            {!singleHabitId && (
                                <div className="text-right">
                                    <span className="text-3xl font-bold">{habits.length}</span>
                                    <p className="text-sm text-muted-foreground">Total Habits</p>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-8 pt-4">
                            {weekStats.map(stat => (
                                <div key={stat.id} className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stat.color }} />
                                            <span className="font-semibold text-lg">{stat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-lg">{stat.improvement > 0 ? "+" : ""}{stat.improvement}% vs last week</span>
                                            <p className="text-sm text-muted-foreground">Avg level: {stat.avg} / 4</p>
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full transition-all duration-500 ease-out" style={{ width: `${stat.rate}%`, backgroundColor: stat.color }} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                </div>
            </DialogContent>
        </Dialog>
    );
};
