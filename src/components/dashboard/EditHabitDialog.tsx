import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateHabit, Habit } from "@/hooks/useHabits";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Palette, MousePointer2 } from "lucide-react";

const ICONS = ["🧘", "💪", "📚", "💧", "✍️", "📵", "🏃", "🥗", "😴", "🎯", "🎨", "🧹", "💬", "🤝", "🙏", "🌿", "🚫", "📱", "💰", "📋", "🌬️", "🪞", "🎰", "👋"];

const COLORS = [
  "hsl(0, 84%, 60%)",
  "hsl(15, 90%, 55%)",
  "hsl(30, 95%, 50%)",
  "hsl(45, 100%, 51%)",
  "hsl(60, 80%, 45%)",
  "hsl(80, 60%, 45%)",
  "hsl(120, 60%, 45%)",
  "hsl(140, 70%, 40%)",
  "hsl(160, 70%, 40%)",
  "hsl(180, 70%, 40%)",
  "hsl(195, 80%, 45%)",
  "hsl(210, 80%, 50%)",
  "hsl(225, 75%, 55%)",
  "hsl(240, 60%, 55%)",
  "hsl(262, 83%, 45%)",
  "hsl(280, 70%, 50%)",
  "hsl(300, 60%, 50%)",
  "hsl(320, 70%, 50%)",
  "hsl(340, 80%, 55%)",
  "hsl(350, 85%, 55%)",
  "hsl(0, 0%, 30%)",
  "hsl(0, 0%, 50%)",
  "hsl(30, 30%, 40%)",
  "hsl(200, 15%, 45%)",
];

interface EditHabitDialogProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditHabitDialog = ({ habit, open, onOpenChange }: EditHabitDialogProps) => {
  const [icon, setIcon] = useState(habit.icon);
  const [color, setColor] = useState(habit.color);
  const updateHabit = useUpdateHabit();

  useEffect(() => {
    if (open) {
      setIcon(habit.icon);
      setColor(habit.color);
    }
  }, [open, habit]);

  const handleSave = () => {
    updateHabit.mutate(
      { id: habit.id, icon, color },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="glass border-primary/20 max-w-md bg-popover/95 backdrop-blur-xl"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Edit Habit Appearance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MousePointer2 className="w-3 h-3" /> Select Icon
            </Label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`text-2xl p-2 rounded-xl transition-all ${icon === i 
                    ? "bg-primary/20 ring-2 ring-primary scale-110 shadow-lg" 
                    : "hover:bg-secondary/80 grayscale-[0.5] hover:grayscale-0"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Palette className="w-3 h-3" /> Theme Color
            </Label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-10 rounded-xl transition-all ${color === c 
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110 shadow-md" 
                    : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateHabit.isPending}
              className="flex-1 gradient-primary hover:opacity-90 rounded-xl"
            >
              {updateHabit.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
