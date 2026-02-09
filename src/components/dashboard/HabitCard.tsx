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
import { Trash2 } from "lucide-react";

interface HabitCardProps {
  habit: Habit;
  weekCompletions: HabitCompletion[];
  todayCompletion: HabitCompletion | undefined;
  onLogEffort: (habitId: string, level: number) => void;
  onDelete: (habitId: string) => void;
}

const HabitCard = ({ habit, weekCompletions, todayCompletion, onLogEffort, onDelete }: HabitCardProps) => {
  const weeklyData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split("T")[0];
      const completion = weekCompletions.find(
        (c) => c.habit_id === habit.id && c.completion_date === dateStr
      );
      return {
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        effort: completion?.effort_level || 0,
      };
    });
  }, [weekCompletions, habit.id]);

  const currentEffort = todayCompletion?.effort_level || 0;

  // Calculate "improvement" as change from previous week (simplified)
  const thisWeekTotal = weeklyData.reduce((sum, d) => sum + d.effort, 0);
  const maxPossible = 7 * 4;
  const improvement = maxPossible > 0 ? Math.round(((thisWeekTotal / maxPossible) * 100) - 50) : 0;

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
        <CardContent className="p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{habit.icon}</span>
              <p className="font-semibold text-sm text-white truncate">{habit.name}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-black/20 transition-smooth">
                  <MoreHorizontal className="w-4 h-4 text-white/80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-border/50">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => onDelete(habit.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Habit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mini Chart */}
          <div className="flex-1 min-h-[80px] mb-2">
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={weeklyData}>
                <XAxis
                  dataKey="day"
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
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
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/70 font-medium">Log your effort:</span>
            <div className="flex items-center gap-1 text-xs text-white/70">
              <TrendingUp className="w-3 h-3" />
              <span>{improvement >= 0 ? "+" : ""}{improvement}%</span>
            </div>
          </div>

          {/* Effort Buttons */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                onClick={() => onLogEffort(habit.id, level)}
                className={`flex-1 h-9 rounded-full text-sm font-bold transition-smooth ${
                  currentEffort === level
                    ? "bg-white text-black shadow-lg"
                    : "bg-black/20 text-white hover:bg-black/30"
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
