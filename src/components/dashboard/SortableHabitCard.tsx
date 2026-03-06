import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal } from "lucide-react";
import HabitCard from "./HabitCard";
import { Habit, HabitCompletion } from "@/hooks/useHabits";

interface SortableHabitCardProps {
    habit: Habit;
    weekCompletions: HabitCompletion[];
    todayCompletion: HabitCompletion | undefined;
    cycleWeekDates: string[];
    prevCycleWeekDates: string[];
    daysElapsedInWeek: number;
    onLogEffort: (habitId: string, level: number) => void;
    onArchive: (habitId: string) => void;
}

export const SortableHabitCard = ({ habit, ...props }: SortableHabitCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: habit.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative select-none outline-none ${isDragging ? "opacity-90 scale-105 cursor-grabbing" : ""}`}
            {...attributes}
            {...listeners}
        >
            <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-opacity duration-300 ${isDragging ? "opacity-100" : "opacity-0"}`}>
                <GripHorizontal className="w-5 h-5 text-white/90 drop-shadow-md" />
            </div>
            <HabitCard habit={habit} {...props} />
        </div>
    );
};
