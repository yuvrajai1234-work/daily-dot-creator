import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Habit, HabitCompletion } from "@/hooks/useHabits";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, Archive } from "lucide-react";
import { getAppDate } from "@/lib/dateUtils";
import { ImprovementDialog } from "./ImprovementDialog";

interface HabitCardProps {
  habit: Habit;
  weekCompletions: HabitCompletion[];
  todayCompletion: HabitCompletion | undefined;
  cycleWeekDates: string[];     // 7 dates for the current cycle week
  prevCycleWeekDates: string[]; // 7 dates for the previous cycle week (empty in Week 1)
  daysElapsedInWeek: number;    // how many days have passed in current cycle week (min 1)
  onLogEffort: (habitId: string, level: number) => void;
  onArchive: (habitId: string) => void;
  onImprovementCalculated?: (habitId: string, improvement: number) => void;
}

const HabitCard = ({
  habit, weekCompletions, todayCompletion,
  cycleWeekDates, prevCycleWeekDates, daysElapsedInWeek,
  onLogEffort, onArchive, onImprovementCalculated
}: HabitCardProps) => {

  // Mini chart: current cycle week (7 fixed dates passed from parent)
  // Future dates in the week show as 0 so the whole week slot is visible
  const weeklyData = useMemo(() => {
    const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const todayStr = getAppDate();

    return cycleWeekDates.map((dateStr) => {
      const date = new Date(dateStr + "T00:00:00");
      const isFuture = dateStr > todayStr;
      const completion = isFuture
        ? undefined
        : weekCompletions.find((c) => c.habit_id === habit.id && c.completion_date === dateStr);

      const label = DAY_LABELS[date.getDay()];
      return {
        day: label,
        date: dateStr,
        effort: completion?.effort_level || 0,
        isFuture,
      };
    });
  }, [weekCompletions, habit.id, cycleWeekDates]);

  const currentEffort = todayCompletion?.effort_level || 0;

  // Improvement: current cycle week (paced) vs previous cycle week (full 7 days)
  // This matches ImprovementDialog and Dashboard stats — all consistent.
  // If Week 2 had 0% and Week 3 has any activity → correctly shows positive.
  const improvement = useMemo(() => {
    const currSet = new Set(cycleWeekDates);
    const prevSet = new Set(prevCycleWeekDates);

    let currScore = 0;
    let prevScore = 0;

    weekCompletions.forEach((c) => {
      if (c.habit_id !== habit.id) return;
      if (currSet.has(c.completion_date)) currScore += c.effort_level || 0;
      else if (prevSet.has(c.completion_date)) prevScore += c.effort_level || 0;
    });

    // Current week paced: score / (days elapsed × max effort 4)
    const currRate = (currScore / (daysElapsedInWeek * 4)) * 100;
    // Previous week full: score / (7 days × max effort 4), 0 if no prior week
    const prevRate = prevCycleWeekDates.length > 0 ? (prevScore / (7 * 4)) * 100 : 0;

    const diff = Math.round(currRate - prevRate);
    onImprovementCalculated?.(habit.id, diff);
    return diff;
  }, [weekCompletions, habit.id, cycleWeekDates, prevCycleWeekDates, daysElapsedInWeek, onImprovementCalculated]);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        className="overflow-hidden border-0 h-full"
        style={{ backgroundColor: habit.color }}
      >
        <CardContent className="p-4 flex flex-col h-full relative">
          <ImprovementDialog
            overallImprovement={improvement}
            singleHabitId={habit.id}
            trigger={
              <button
                className="absolute inset-0 w-full h-full z-0 cursor-pointer focus:outline-none hover:bg-black/5 transition-colors rounded-xl"
                aria-label={`View ${habit.name} improvement`}
              />
            }
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-3 relative z-10 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="text-xl pointer-events-auto">{habit.icon}</span>
              <p className="font-semibold text-sm text-white truncate pointer-events-auto">{habit.name}</p>
            </div>
            <div className="pointer-events-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded hover:bg-black/20 transition-smooth">
                    <MoreHorizontal className="w-4 h-4 text-white/80" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass border-border/50">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onArchive(habit.id)}
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Habit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="flex-1 min-h-[80px] mb-2 relative z-10 pointer-events-none">
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={weeklyData}>
                <XAxis
                  dataKey="day"
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  minTickGap={0}
                />
                <Line
                  type="monotone"
                  dataKey="effort"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mb-3 relative z-10 pointer-events-none">
            <span className="text-xs text-white/70 font-medium">Log your effort:</span>
            <div className="flex items-center gap-1 text-xs text-white/70 pointer-events-auto cursor-default font-medium bg-black/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>{improvement >= 0 ? "+" : ""}{improvement}%</span>
            </div>
          </div>

          {/* Effort Buttons */}
          <div className="flex gap-2 relative z-10 pointer-events-auto">
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                onClick={() => onLogEffort(habit.id, level)}
                className={`flex-1 h-9 rounded-full text-sm font-bold transition-smooth ${currentEffort === level
                  ? "bg-white text-black shadow-lg"
                  : "bg-black/20 text-white hover:bg-black/30 bg-opacity-30 backdrop-blur-sm hover:backdrop-blur-md"
                  }`}
              >
                {level}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HabitCard;
