import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useCreateHabit } from "@/hooks/useHabits";

const ICONS = ["🧘", "💪", "📚", "💧", "✍️", "📵", "🏃", "🥗", "😴", "🎯", "🎨", "🧹"];
const COLORS = [
  "hsl(262, 83%, 45%)",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(200, 80%, 50%)",
  "hsl(310, 70%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(170, 70%, 40%)",
  "hsl(330, 80%, 50%)",
];

const AddHabitDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✅");
  const [color, setColor] = useState(COLORS[0]);
  const createHabit = useCreateHabit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createHabit.mutate(
      { name: name.trim(), icon, color },
      {
        onSuccess: () => {
          setName("");
          setIcon("✅");
          setColor(COLORS[0]);
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4 mr-1" /> Add Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-primary/20">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Habit Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Meditation"
              className="bg-secondary/50 border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`text-2xl p-2 rounded-lg transition-smooth ${
                    icon === i ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-secondary"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-10 rounded-lg transition-smooth ${
                    color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={createHabit.isPending}
            className="w-full gradient-primary hover:opacity-90"
          >
            {createHabit.isPending ? "Creating..." : "Create Habit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddHabitDialog;
