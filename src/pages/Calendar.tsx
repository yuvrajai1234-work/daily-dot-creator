import { useState, useMemo } from "react";
import { Calendar as UICalendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useHabits, useAllCompletions } from "@/hooks/useHabits";
import { useReminders } from "@/hooks/useReminders";
import { RemindersSection } from "@/components/calendar/RemindersSection";

const effortLevelLabels: Record<number, string> = {
  1: "Easy",
  2: "Moderate",
  3: "Solid",
  4: "Intense",
};

const CalendarPage = () => {
  const { data: habits = [] } = useHabits();
  const { data: completions = [], isLoading } = useAllCompletions();
  const { reminders } = useReminders();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

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
    const level1: Date[] = [];
    const level2: Date[] = [];
    const level3: Date[] = [];
    const level4: Date[] = [];
    const special: Date[] = [];

    completionDates.forEach((level, dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      if (level === 1) level1.push(date);
      else if (level === 2) level2.push(date);
      else if (level === 3) level3.push(date);
      else if (level >= 4) level4.push(date);
    });

    reminders.forEach((r) => {
      if (r.isSpecial) {
        const [year, month, day] = r.date.split("-").map(Number);
        // Avoid adding duplicate dates if multiple special events on same day
        const timestamp = new Date(year, month - 1, day).getTime();
        const exists = special.some(d => d.getTime() === timestamp);
        if (!exists) {
          special.push(new Date(year, month - 1, day));
        }
      }
    });

    return { level1, level2, level3, level4, special };
  }, [completionDates, reminders]);

  const specialEventsForMonth = useMemo(() => {
    const monthPrefix = format(currentMonth, "yyyy-MM");
    return reminders
      .filter((r) => r.isSpecial && r.date.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [currentMonth, reminders]);

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
              Days are highlighted based on the highest intensity habit completed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col items-center gap-6">
              <UICalendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border border-border"
                modifiers={modifiers}
                modifiersClassNames={{
                  level1: "bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30 hover:bg-teal-500/30",
                  level2: "bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30 hover:bg-sky-500/30",
                  level3: "bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 hover:bg-indigo-500/30",
                  level4: "bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 hover:bg-rose-500/30",
                  special: "ring-2 ring-destructive ring-offset-1 ring-offset-background font-bold text-destructive",
                }}
              />

              {/* Special Events Section */}
              <div className="w-full max-w-[280px]">
                <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                  🚨 Special Events ({format(currentMonth, "MMMM")})
                </h4>
                {specialEventsForMonth.length > 0 ? (
                  <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {specialEventsForMonth.map((r) => {
                      const eventDate = new Date(r.date + "T00:00:00");
                      const isToday = format(eventDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                      return (
                        <li
                          key={r.id}
                          className={`text-xs p-3 rounded-lg border font-medium flex justify-between items-center shadow-sm transition-colors ${isToday
                              ? "bg-destructive text-destructive-foreground border-destructive"
                              : "bg-destructive/10 text-destructive-foreground border-destructive/20 hover:bg-destructive/20"
                            }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[10px] uppercase tracking-wider font-bold opacity-80 ${isToday ? "text-white" : "text-destructive"}`}>
                              {format(eventDate, "MMM d")}
                            </span>
                            <span className="text-sm">{r.title}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isToday ? "bg-white/20 text-white" : "bg-background/40 text-destructive-foreground"
                            }`}>
                            {r.time}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground p-3 border border-border/50 rounded-lg bg-secondary/10 text-center italic">
                    No special events for {format(currentMonth, "MMMM")}.
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <h3 className="text-lg font-semibold">
                {selectedDate
                  ? `Completions for ${format(selectedDate, "MMMM dd, yyyy")}`
                  : "Select a date"}
              </h3>
              {dayCompletions.length > 0 ? (
                <ul className="space-y-2">
                  {dayCompletions.map((log, index) => {
                    // Determine color for badge based on level
                    let badgeColor = "border-teal-500/50 text-teal-400";
                    if (log.effort_level === 2) badgeColor = "border-sky-500/50 text-sky-400";
                    if (log.effort_level === 3) badgeColor = "border-indigo-500/50 text-indigo-400";
                    if (log.effort_level === 4) badgeColor = "border-rose-500/50 text-rose-400";

                    return (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex justify-between items-center p-3 rounded-lg border border-border/50 glass hover:bg-white/5 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {habitsMap[log.habit_id] || "Unknown habit"}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={badgeColor}
                        >
                          {effortLevelLabels[log.effort_level] || `Level ${log.effort_level}`}
                        </Badge>
                      </motion.li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-8 bg-secondary/10 rounded-lg">
                  No habits logged for this day.
                </p>
              )}

              {/* Legend */}
              <div className="pt-6 border-t border-border/50">
                <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                  Intensity Legend
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded bg-teal-500/10 border border-teal-500/20">
                    <div className="w-3 h-3 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                    <span className="text-teal-100">Easy (1)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-sky-500/10 border border-sky-500/20">
                    <div className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                    <span className="text-sky-100">Moderate (2)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-indigo-500/10 border border-indigo-500/20">
                    <div className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                    <span className="text-indigo-100">Solid (3)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-rose-500/10 border border-rose-500/20">
                    <div className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]" />
                    <span className="text-rose-100">Intense (4)</span>
                  </div>
                </div>
              </div>


            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reminders Section */}
      <RemindersSection date={selectedDate} />
    </div>
  );
};

export default CalendarPage;
