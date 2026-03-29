import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useHabits, useAllCompletions } from "@/hooks/useHabits";
import { getAppDate, getCycleStartDate, formatLocalISODate } from "@/lib/dateUtils";
import { useProfile } from "@/hooks/useProfile";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";

interface ImprovementDialogProps {
    trigger: React.ReactNode;
    overallImprovement: number;
    singleHabitId?: string;
}

// Small reusable collapsible stat row
const CollapsibleStat = ({
    label,
    improvement,
    children,
}: {
    label: string;
    improvement: number;
    children: React.ReactNode;
}) => {
    const [open, setOpen] = useState(false);
    const color = improvement > 0 ? "text-emerald-400" : improvement < 0 ? "text-red-400" : "text-muted-foreground";
    const Icon = improvement > 0 ? TrendingUp : improvement < 0 ? TrendingDown : Minus;

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <span className="font-semibold text-sm">{label}</span>
                    <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1 text-sm font-bold ${color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {improvement > 0 ? "+" : ""}{improvement}%
                        </span>
                        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pt-3 pb-1 space-y-3 animate-in slide-in-from-top-1">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
};

export const ImprovementDialog = ({ trigger, overallImprovement, singleHabitId }: ImprovementDialogProps) => {
    const { data: allHabits = [] } = useHabits();
    const { data: allCompletions = [] } = useAllCompletions();
    const { data: profile } = useProfile();

    // Filter to a single habit if singleHabitId is provided
    const habits = useMemo(() => {
        if (singleHabitId) return allHabits.filter(h => h.id === singleHabitId);
        return allHabits;
    }, [allHabits, singleHabitId]);

    const singleHabit = singleHabitId && habits.length === 1 ? habits[0] : null;

    // --- Cycle metadata (anchored to account creation date) ---
    const cycleInfo = useMemo(() => {
        const cycleStart = getCycleStartDate(profile?.created_at);
        const todayStr = getAppDate();
        const today = new Date(todayStr + "T00:00:00");

        const diffDays = Math.floor(
            (today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        const currentWeekIndex = Math.min(Math.floor(Math.max(0, diffDays) / 7), 3);
        const dayInWeek = diffDays - currentWeekIndex * 7;

        const weekBoundaryLabels: string[] = [];
        for (let w = 1; w <= 3; w++) {
            const d = new Date(cycleStart);
            d.setDate(d.getDate() + w * 7);
            weekBoundaryLabels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
        }

        return { cycleStart, currentWeekIndex, dayInWeek, weekBoundaryLabels, todayStr };
    }, [profile?.created_at]);

    // --- Cycle Score: total points in the current 28-day cycle ---
    const monthlyStats = useMemo(() => {
        const { cycleStart, todayStr } = cycleInfo;
        const cycleEndDate = new Date(cycleStart);
        cycleEndDate.setDate(cycleEndDate.getDate() + 27);
        const cycleStartStr = formatLocalISODate(cycleStart);
        const cycleEndStr = formatLocalISODate(cycleEndDate);
        const maxCycleScore = 28 * 4; // 112

        const cycleScore = allCompletions
            .filter(c =>
                c.completion_date >= cycleStartStr &&
                c.completion_date <= cycleEndStr &&
                (singleHabitId ? c.habit_id === singleHabitId : habits.some(h => h.id === c.habit_id))
            )
            .reduce((sum, c) => sum + (c.effort_level || 0), 0);

        const pct = Math.round((cycleScore / maxCycleScore) * 100);
        return { monthlyScore: cycleScore, maxMonthlyScore: maxCycleScore, pct };
    }, [allCompletions, habits, singleHabitId, cycleInfo]);

    // --- 28-day cycle chart data ---
    const chartData = useMemo(() => {
        const { cycleStart, todayStr } = cycleInfo;
        const maxDailyScore = habits.length > 0 ? habits.length * 4 : 4;

        return Array.from({ length: 28 }, (_, i) => {
            const date = new Date(cycleStart);
            date.setDate(date.getDate() + i);
            const dateStr = formatLocalISODate(date);
            const isFuture = dateStr > todayStr;
            const weekNum = Math.floor(i / 7) + 1;
            const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

            if (isFuture) return { date: label, dateStr, percentage: null, week: weekNum };

            const dayCompletions = allCompletions.filter(c => {
                if (c.completion_date !== dateStr) return false;
                if (singleHabitId) return c.habit_id === singleHabitId;
                return habits.some(h => h.id === c.habit_id);
            });

            const score = dayCompletions.reduce((sum, c) => sum + (c.effort_level || 0), 0);
            const percentage = Math.round((score / maxDailyScore) * 100);
            return { date: label, dateStr, percentage, week: weekNum };
        });
    }, [allCompletions, habits, singleHabitId, cycleInfo]);

    // --- Per-habit stats: current vs previous cycle week ---
    const habitStats = useMemo(() => {
        const { cycleStart, currentWeekIndex, dayInWeek } = cycleInfo;

        const currWeekStart = new Date(cycleStart);
        currWeekStart.setDate(currWeekStart.getDate() + currentWeekIndex * 7);
        const currWeekStartStr = formatLocalISODate(currWeekStart);
        const currWeekEnd = new Date(currWeekStart);
        currWeekEnd.setDate(currWeekEnd.getDate() + 6);
        const currWeekEndStr = formatLocalISODate(currWeekEnd);

        let prevWeekStartStr = "";
        let prevWeekEndStr = "";
        if (currentWeekIndex > 0) {
            const prevWeekStart = new Date(cycleStart);
            prevWeekStart.setDate(prevWeekStart.getDate() + (currentWeekIndex - 1) * 7);
            prevWeekStartStr = formatLocalISODate(prevWeekStart);
            const prevWeekEnd = new Date(prevWeekStart);
            prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);
            prevWeekEndStr = formatLocalISODate(prevWeekEnd);
        }

        const daysElapsed = Math.max(1, dayInWeek + 1);

        return habits.map(habit => {
            let currScore = 0;
            let prevScore = 0;
            let loggedDaysThisWeek = 0;

            allCompletions.forEach(c => {
                if (c.habit_id !== habit.id) return;
                if (c.completion_date >= currWeekStartStr && c.completion_date <= currWeekEndStr) {
                    currScore += c.effort_level || 0;
                    loggedDaysThisWeek++;
                } else if (prevWeekStartStr && c.completion_date >= prevWeekStartStr && c.completion_date <= prevWeekEndStr) {
                    prevScore += c.effort_level || 0;
                }
            });

            const currRate = Math.round((currScore / (daysElapsed * 4)) * 100);
            const prevRate = currentWeekIndex > 0 ? Math.round((prevScore / (7 * 4)) * 100) : 0;
            const improvement = currRate - prevRate;
            const avg = (currScore / daysElapsed).toFixed(1); // paced avg per elapsed day, max 4

            return { ...habit, currScore, prevScore, currRate, prevRate, improvement, avg, loggedDaysThisWeek, daysElapsed };
        });
    }, [habits, allCompletions, cycleInfo]);

    // --- Overall 30-day stats (last 30 vs prior 30 days) ---
    const overall30Stats = useMemo(() => {
        const todayTime = new Date(getAppDate() + "T00:00:00").getTime();
        const maxScore = 30 * 4;

        let last30 = 0;
        let prev30 = 0;

        allCompletions.forEach(c => {
            if (singleHabitId && c.habit_id !== singleHabitId) return;
            if (!singleHabitId && !habits.some(h => h.id === c.habit_id)) return;
            const diff = Math.round((todayTime - new Date(c.completion_date + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff <= 29) last30 += c.effort_level || 0;
            else if (diff >= 30 && diff <= 59) prev30 += c.effort_level || 0;
        });

        const last30Rate = Math.round((last30 / maxScore) * 100);
        const prev30Rate = Math.round((prev30 / maxScore) * 100);
        const improvement = last30Rate - prev30Rate;

        return { last30, prev30, last30Rate, prev30Rate, improvement };
    }, [allCompletions, habits, singleHabitId]);

    // --- Total completions for this habit (all time) ---
    const totalCompletions = useMemo(() => {
        if (!singleHabitId) return 0;
        return allCompletions.filter(c => c.habit_id === singleHabitId).length;
    }, [allCompletions, singleHabitId]);

    const ImprovementIcon = overallImprovement > 0 ? TrendingUp : overallImprovement < 0 ? TrendingDown : Minus;
    const improvementColor = overallImprovement > 0 ? "text-emerald-400" : overallImprovement < 0 ? "text-red-400" : "text-muted-foreground";

    const weekLabel = `Week ${cycleInfo.currentWeekIndex + 1}`;
    const prevWeekLabel = cycleInfo.currentWeekIndex > 0 ? `Week ${cycleInfo.currentWeekIndex}` : null;

    // Format habit created_at nicely
    const habitCreatedOn = useMemo(() => {
        if (!singleHabit?.created_at) return null;
        const d = new Date(singleHabit.created_at);
        return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
    }, [singleHabit?.created_at]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent 
                className="max-w-3xl w-[90vw] max-h-[85vh] overflow-y-auto glass border-primary/20"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                onPointerEnter={(e) => e.stopPropagation()}
                onPointerLeave={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {singleHabit ? singleHabit.name : "Improvement"}
                    </DialogTitle>
                    {habitCreatedOn && (
                        <p className="text-sm text-muted-foreground">Created on: {habitCreatedOn}</p>
                    )}
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* ── Single-habit extras ── */}
                    {singleHabit && (
                        <>
                            {/* Monthly Score */}
                            <Card className="glass border-border/50">
                                <CardContent className="p-5 space-y-3">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cycle Score</p>
                                    <p className="text-3xl font-bold">
                                        {monthlyStats.monthlyScore}{" "}
                                        <span className="text-muted-foreground font-normal text-xl">/ {monthlyStats.maxMonthlyScore}</span>
                                    </p>
                                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: `${Math.min(monthlyStats.pct, 100)}%`,
                                                backgroundColor: singleHabit.color,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        You are at <span className="font-semibold text-foreground">{monthlyStats.pct}%</span> of your 28-day cycle goal!
                                    </p>
                                    {/* Total completions divider */}
                                    <div className="pt-2 mt-1 border-t border-border/40 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Total completions (all time)</span>
                                        <span className="text-sm font-bold tabular-nums">{totalCompletions} days</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Habit Weekly Stats — collapsible */}
                            <Card className="glass border-border/50 overflow-hidden">
                                <CardContent className="p-3">
                                    <CollapsibleStat
                                        label={`Habit Weekly Stats`}
                                        improvement={overallImprovement}
                                    >
                                        {habitStats.map(stat => {
                                            const statColor = stat.improvement > 0 ? "text-emerald-400" : stat.improvement < 0 ? "text-red-400" : "text-muted-foreground";
                                            return (
                                                <div key={stat.id} className="space-y-2 pb-2">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground">{stat.loggedDaysThisWeek}/{stat.daysElapsed} days · avg {stat.avg}/4</span>
                                                        <span className={`font-bold ${statColor}`}>{stat.improvement > 0 ? "+" : ""}{stat.improvement}%</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>{weekLabel} (paced)</span>
                                                            <span>{stat.currRate}%</span>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(stat.currRate, 100)}%`, backgroundColor: stat.color }} />
                                                        </div>
                                                        {prevWeekLabel && (
                                                            <>
                                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                                    <span>{prevWeekLabel}</span>
                                                                    <span>{stat.prevRate}%</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                                    <div className="h-full rounded-full transition-all duration-700 opacity-50" style={{ width: `${Math.min(stat.prevRate, 100)}%`, backgroundColor: stat.color }} />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CollapsibleStat>
                                </CardContent>
                            </Card>

                            {/* Overall Stats 30-day — collapsible */}
                            <Card className="glass border-border/50 overflow-hidden">
                                <CardContent className="p-3">
                                    <CollapsibleStat
                                        label="Overall Stats (30 days)"
                                        improvement={overall30Stats.improvement}
                                    >
                                        <div className="space-y-2 pb-2">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Last 30 days</span>
                                                    <span>{overall30Stats.last30Rate}%</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(overall30Stats.last30Rate, 100)}%`, backgroundColor: singleHabit.color }} />
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Prior 30 days</span>
                                                    <span>{overall30Stats.prev30Rate}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700 opacity-50" style={{ width: `${Math.min(overall30Stats.prev30Rate, 100)}%`, backgroundColor: singleHabit.color }} />
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground pt-1">
                                                Total points last 30d: <span className="text-foreground font-semibold">{overall30Stats.last30}</span>
                                                {" · "}Prior 30d: <span className="text-foreground font-semibold">{overall30Stats.prev30}</span>
                                            </p>
                                        </div>
                                    </CollapsibleStat>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Top Improvement Card */}
                    <Card className="glass border-border/50 shadow-xl overflow-hidden">
                        <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                        <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center space-y-3 relative">
                            <div className={`flex items-center gap-2 ${improvementColor}`}>
                                <ImprovementIcon className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                            <h2 className={`text-5xl sm:text-7xl font-bold ${improvementColor} tracking-tighter`}>
                                {overallImprovement > 0 ? "+" : ""}{overallImprovement}%
                            </h2>
                            <div className="text-center space-y-1">
                                <p className="text-sm sm:text-base font-bold text-foreground">
                                    Overall Improvement
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground px-4">
                                    {weekLabel}{prevWeekLabel ? ` vs ${prevWeekLabel}` : " (Current Cycle)"}
                                    {!singleHabitId && habits.length > 1 && (
                                        <span className="block mt-0.5 opacity-80 text-[10px] sm:text-xs">Based on {habits.length} habits</span>
                                    )}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 28-Day Cycle Chart */}
                    <Card className="glass border-border/50 overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg md:text-xl font-bold">28-Day Cycle Analysis</CardTitle>
                                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                        Your effort as % of max potential over the current 28-day cycle.
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 self-center sm:self-auto bg-secondary/20 p-1 rounded-lg">
                                    {[1, 2, 3, 4].map(w => (
                                        <span
                                            key={w}
                                            className={`text-[10px] md:text-xs px-2.5 py-1 rounded-md font-bold transition-all ${w === cycleInfo.currentWeekIndex + 1
                                                ? "bg-primary text-white shadow-lg"
                                                : "text-muted-foreground hover:bg-secondary/50"
                                                }`}
                                        >
                                            W{w}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="cycleGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="hsl(240, 5%, 64.9%)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={20}
                                    />
                                    <YAxis
                                        stroke="hsl(240, 5%, 64.9%)"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => `${v}%`}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "hsl(240, 10%, 6%)",
                                            border: "1px solid hsl(240, 3.7%, 15.9%)",
                                            borderRadius: "8px",
                                        }}
                                        formatter={(value: number, _name: string, props: any) => [
                                            value != null ? `${value}%` : "—",
                                            `Week ${props?.payload?.week ?? ""} effort`,
                                        ]}
                                    />
                                    {cycleInfo.weekBoundaryLabels.map((label, idx) => (
                                        <ReferenceLine
                                            key={label}
                                            x={label}
                                            stroke="rgba(255,255,255,0.15)"
                                            strokeDasharray="5 4"
                                            label={{
                                                value: `W${idx + 2}`,
                                                position: "insideTopRight",
                                                fill: "hsl(240, 5%, 55%)",
                                                fontSize: 10,
                                            }}
                                        />
                                    ))}
                                    <Area
                                        type="monotone"
                                        dataKey="percentage"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fill="url(#cycleGradient)"
                                        dot={false}
                                        activeDot={{ r: 4, fill: "#3b82f6" }}
                                        connectNulls={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Per-Habit Breakdown — only shown for multi-habit view */}
                    {!singleHabitId && (
                        <Card className="glass border-border/50 overflow-hidden">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg md:text-xl font-bold">Habit Breakdown</CardTitle>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        {weekLabel} summary · {cycleInfo.dayInWeek + 1} day{cycleInfo.dayInWeek !== 0 ? "s" : ""} complete
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 sm:text-right bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                                    <span className="text-2xl font-black text-primary leading-none">{habits.length}</span>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-primary/80">Active<br/>Habits</div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-4">
                                {habitStats.map(stat => {
                                    const statColor =
                                        stat.improvement > 0 ? "text-emerald-400"
                                            : stat.improvement < 0 ? "text-red-400"
                                                : "text-muted-foreground";
                                    return (
                                        <div key={stat.id} className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: stat.color }} />
                                                    <div>
                                                        <span className="font-semibold text-base">{stat.name}</span>
                                                        <p className="text-xs text-muted-foreground">
                                                            {stat.loggedDaysThisWeek}/{stat.daysElapsed} days logged · avg {stat.avg}/4
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`text-right font-bold text-base ${statColor}`}>
                                                    {stat.improvement > 0 ? "+" : ""}{stat.improvement}%
                                                    <p className="text-xs text-muted-foreground font-normal">
                                                        {prevWeekLabel ? `vs ${prevWeekLabel}` : "first week"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{weekLabel} (paced)</span>
                                                    <span>{stat.currRate}%</span>
                                                </div>
                                                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div className="h-full transition-all duration-700 ease-out rounded-full" style={{ width: `${Math.min(stat.currRate, 100)}%`, backgroundColor: stat.color }} />
                                                </div>
                                                {prevWeekLabel && (
                                                    <>
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>{prevWeekLabel}</span>
                                                            <span>{stat.prevRate}%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                            <div className="h-full transition-all duration-700 ease-out rounded-full opacity-50" style={{ width: `${Math.min(stat.prevRate, 100)}%`, backgroundColor: stat.color }} />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
};
