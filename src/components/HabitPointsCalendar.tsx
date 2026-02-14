import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { useAllCompletions, useHabits } from "@/hooks/useHabits";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";

const HabitPointsCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { data: completions = [] } = useAllCompletions();
    const { data: habits = [] } = useHabits();

    // Calculate points for each day
    const dailyPoints = useMemo(() => {
        const pointsMap = new Map<string, number>();

        completions.forEach((completion) => {
            const date = completion.completion_date;
            const points = completion.effort_level || 0;

            if (pointsMap.has(date)) {
                pointsMap.set(date, pointsMap.get(date)! + points);
            } else {
                pointsMap.set(date, points);
            }
        });

        return pointsMap;
    }, [completions]);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get start day of week (0 = Sunday, 1 = Monday, etc.)
    const startDayOfWeek = monthStart.getDay();

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const today = new Date();
    const selectedDateString = format(selectedDate, "yyyy-MM-dd");
    const selectedDatePoints = dailyPoints.get(selectedDateString) || 0;

    // Get selected date's habit completions with habit names
    const selectedDateCompletions = useMemo(() => {
        const dayCompletions = completions.filter(
            (c) => c.completion_date === selectedDateString
        );

        // Map completions to include habit names
        return dayCompletions.map((completion) => {
            const habit = habits.find(h => h.id === completion.habit_id);
            return {
                ...completion,
                habitName: habit?.name || "Unknown Habit",
                habitIcon: habit?.icon || "📝"
            };
        });
    }, [completions, selectedDateString, habits]);

    const getPointsForDate = (date: Date) => {
        const dateString = format(date, "yyyy-MM-dd");
        return dailyPoints.get(dateString) || 0;
    };

    const getColorForPoints = (points: number) => {
        if (points === 0) return "bg-secondary/20";
        if (points <= 5) return "bg-blue-500/30";
        if (points <= 10) return "bg-primary/50";
        if (points <= 15) return "bg-primary/70";
        return "bg-primary";
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
    };

    return (
        <Card className="glass border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Daily Habit Points
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Calendar Navigation */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={previousMonth}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h3 className="font-semibold text-lg">
                        {format(currentDate, "MMMM yyyy")}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={nextMonth}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                {/* Calendar Grid */}
                <div className="space-y-2">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-2 text-center">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                            <div key={day} className="text-xs font-medium text-muted-foreground">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                        {/* Empty cells for days before month starts */}
                        {Array.from({ length: startDayOfWeek }).map((_, index) => (
                            <div key={`empty-${index}`} className="aspect-square" />
                        ))}

                        {/* Actual days */}
                        {daysInMonth.map((date) => {
                            const points = getPointsForDate(date);
                            const isToday = isSameDay(date, today);
                            const isSelected = isSameDay(date, selectedDate);
                            const dateString = format(date, "yyyy-MM-dd");

                            return (
                                <button
                                    key={dateString}
                                    onClick={() => handleDateClick(date)}
                                    className={`
                    aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                    transition-all cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary/50
                    ${getColorForPoints(points)}
                    ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                    ${isSelected && !isToday ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}
                    ${!isSameMonth(date, currentDate) ? "opacity-30" : ""}
                  `}
                                    title={`${format(date, "MMM d")}: ${points} points`}
                                >
                                    {format(date, "d")}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Date Summary */}
                <div className="pt-4 border-t border-border/30">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Points for {format(selectedDate, "MMMM d, yyyy")}</h4>
                        {!isSameDay(selectedDate, today) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedDate(today)}
                                className="text-xs"
                            >
                                Back to Today
                            </Button>
                        )}
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Points:</span>
                            <span className="text-2xl font-bold text-primary">{selectedDatePoints}</span>
                        </div>

                        {selectedDateCompletions.length > 0 ? (
                            <div className="space-y-2">
                                {selectedDateCompletions.map((completion) => (
                                    <div key={completion.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-secondary/20">
                                        <span className="flex items-center gap-2">
                                            <span className="text-lg">{completion.habitIcon}</span>
                                            <span>{completion.habitName}</span>
                                        </span>
                                        <span className="font-bold text-primary">{completion.effort_level || 0}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {isSameDay(selectedDate, today)
                                    ? "No habits completed today yet."
                                    : "No habits were completed on this day."}
                            </p>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="pt-4 border-t border-border/30">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Points Scale:</p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded bg-secondary/20" />
                            <span className="text-xs">0</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded bg-blue-500/30" />
                            <span className="text-xs">1-5</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded bg-primary/50" />
                            <span className="text-xs">6-10</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded bg-primary/70" />
                            <span className="text-xs">11-15</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded bg-primary" />
                            <span className="text-xs">16+</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default HabitPointsCalendar;
