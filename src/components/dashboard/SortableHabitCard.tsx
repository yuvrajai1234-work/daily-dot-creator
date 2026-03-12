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
            style={{
                ...style,
                touchAction: isDragging ? "none" : "pan-y"
            }}
            className={`relative select-none outline-none rounded-xl ${isDragging
                    ? "opacity-100 scale-[1.02] cursor-grabbing shadow-[0_0_50px_rgba(255,255,255,0.3)] ring-4 ring-white/40 z-50 brightness-110 grayscale-[0.1]"
                    : "transition-shadow duration-300 hover:shadow-xl"
                }`}
            {...attributes}
            {...listeners}
        >
            {/* Spotlight Gradient Overlay when dragging */}
            <div
                className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300 ${isDragging ? "opacity-100 bg-gradient-to-t from-white/10 to-white/5" : "opacity-0"
                    }`}
            />

            {/* Grip Icon */}
            <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300 ${isDragging ? "opacity-100 -translate-y-1 scale-110" : "opacity-0"
                }`}>
                <GripHorizontal className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </div>
            <HabitCard habit={habit} {...props} />
        </div>
    );
};
