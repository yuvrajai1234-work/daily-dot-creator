import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateHabit, Habit } from "@/hooks/useHabits";
import { ListTree, Sparkles } from "lucide-react";

interface LevelCustomizationDialogProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LevelCustomizationDialog = ({ habit, open, onOpenChange }: LevelCustomizationDialogProps) => {
  const [level1, setLevel1] = useState(habit.level1_description || "");
  const [level2, setLevel2] = useState(habit.level2_description || "");
  const [level3, setLevel3] = useState(habit.level3_description || "");
  const [level4, setLevel4] = useState(habit.level4_description || "");
  const updateHabit = useUpdateHabit();

  useEffect(() => {
    if (open) {
      setLevel1(habit.level1_description || "");
      setLevel2(habit.level2_description || "");
      setLevel3(habit.level3_description || "");
      setLevel4(habit.level4_description || "");
    }
  }, [open, habit]);

  const handleSave = () => {
    updateHabit.mutate(
      {
        id: habit.id,
        level1_description: level1,
        level2_description: level2,
        level3_description: level3,
        level4_description: level4,
      },
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
        className="glass border-primary/20 max-w-lg bg-popover/95 backdrop-blur-xl"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListTree className="w-5 h-5 text-primary" />
            Customize Effort Levels
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1"> Define what each level means for <span className="text-foreground font-semibold">{habit.icon} {habit.name}</span></p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="flex flex-col gap-4">
            {[
              { id: 1, val: level1, setter: setLevel1, color: "bg-green-500/10 border-green-500/30 text-green-400" },
              { id: 2, val: level2, setter: setLevel2, color: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
              { id: 3, val: level3, setter: setLevel3, color: "bg-purple-500/10 border-purple-500/30 text-purple-400" },
              { id: 4, val: level4, setter: setLevel4, color: "bg-red-500/10 border-red-500/30 text-red-400" },
            ].map((level) => (
              <div key={level.id} className="flex gap-3 items-center">
                <div className={`w-12 h-12 flex items-center justify-center rounded-xl border text-xl font-bold ${level.color} shadow-sm shrink-0`}>
                  {level.id}
                </div>
                <div className="flex-1 relative">
                  <Input
                    placeholder={`Details for level ${level.id}...`}
                    value={level.val}
                    onChange={(e) => level.setter(e.target.value)}
                    maxLength={15}
                    className="bg-secondary/30 border-border/50 rounded-xl h-12 text-sm focus:bg-secondary/50 transition-all font-medium pr-10"
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${level.val.length >= 15 ? "text-red-400" : "text-muted-foreground/50"}`}>
                    {level.val.length}/15
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateHabit.isPending}
              className="flex-1 gradient-primary hover:opacity-90 rounded-xl h-11 shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {updateHabit.isPending ? "Saving..." : "Save Customization"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
