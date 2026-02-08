import { useState, useMemo } from "react";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useHabits, useAllCompletions } from "@/hooks/useHabits";

const effortLevelLabels: Record<number, string> = {
  1: "Easy",
  2: "Moderate",
  3: "Solid",
  4: "Intense",
};

const CalendarPage = () => {
  const { data: habits = [] } = useHabits();
  const { data: completions = [], isLoading } = useAllCompletions();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const habitsMap = useMemo(() => {
    const map: Record<string, string> = {};
    habits.forEach((h) => {
      map[h.id] = h.name;
    });
    return map;
  }, [habits]);

  // Get completions for the selected date
  const dayCompletions = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return completions.filter((c) => c.completion_date === dateStr);
  }, [completions, selectedDate]);

  // Dates that have completions for calendar highlighting
  const completionDates = useMemo(() => {
    const dateMap = new Map<string, number>();
    completions.forEach((c) => {
      const current = dateMap.get(c.completion_date) || 0;
      dateMap.set(c.completion_date, Math.max(current, c.effort_level));
    });
    return dateMap;
  }, [completions]);

  const modifiers = useMemo(() => {
    const dates = Array.from(completionDates.keys()).map((d) => {
      const [year, month, day] = d.split("-").map(Number);
      return new Date(year, month - 1, day);
    });
    return { completed: dates };
  }, [completionDates]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">View your habit history on a calendar</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Your Habit Calendar</CardTitle>
            <CardDescription>
              Days are highlighted based on your habit completions. Select a day to see details.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex justify-center">
              <UICalendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border border-border"
                modifiers={modifiers}
                modifiersClassNames={{
                  completed: "bg-primary/30 text-primary-foreground font-bold",
                }}
              />
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-lg font-semibold">
                {selectedDate
                  ? `Completions for ${format(selectedDate, "MMMM dd, yyyy")}`
                  : "Select a date"}
              </h3>
              {dayCompletions.length > 0 ? (
                <ul className="space-y-2">
                  {dayCompletions.map((log, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex justify-between items-center p-3 rounded-lg border border-border/50 glass"
                    >
                      <span className="font-medium">
                        {habitsMap[log.habit_id] || "Unknown habit"}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-primary/50 text-primary"
                      >
                        {effortLevelLabels[log.effort_level] || `Level ${log.effort_level}`}
                      </Badge>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No habits logged for this day.
                </p>
              )}

              {/* Legend */}
              <div className="pt-4 border-t border-border/50">
                <p className="font-semibold mb-2 text-sm">Legend:</p>
                <div className="flex flex-wrap gap-3 items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary/30 border border-border" />
                    <span className="text-muted-foreground">Completed day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary border border-border" />
                    <span className="text-muted-foreground">Selected day</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CalendarPage;
