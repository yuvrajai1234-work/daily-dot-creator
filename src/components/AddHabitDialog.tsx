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
import { ScrollArea } from "@/components/ui/scroll-area";

const HABIT_CATEGORIES = [
  {
    label: "Health & Wellness",
    habits: [
      { name: "Workout", icon: "💪" },
      { name: "Daily Exercise", icon: "🏃" },
      { name: "Drink Sufficient Water", icon: "💧" },
      { name: "Consistent Sleep Schedule", icon: "😴" },
      { name: "Healthy Eating Habits", icon: "🥗" },
      { name: "Stretching or Mobility Routine", icon: "🧘" },
    ],
  },
  {
    label: "Mental Wellbeing",
    habits: [
      { name: "Meditation or Mindfulness Practice", icon: "🧘" },
      { name: "Journaling or Gratitude Logging", icon: "✍️" },
      { name: "Screen-Free Wind Down Before Bed", icon: "📵" },
      { name: "Daily Mood Check-In / Reflection", icon: "🪞" },
      { name: "Deep Breathing or Relaxation Exercises", icon: "🌬️" },
    ],
  },
  {
    label: "Productivity & Growth",
    habits: [
      { name: "Reading or Learning", icon: "📚" },
      { name: "Study or Skill Practice", icon: "🎯" },
      { name: "Planning the Day or Setting Priorities", icon: "📋" },
      { name: "Decluttering / Organizing a Space", icon: "🧹" },
      { name: "Budgeting or Expense Tracking", icon: "💰" },
    ],
  },
  {
    label: "Social & Emotional",
    habits: [
      { name: "Connect With a Friend or Loved One", icon: "💬" },
      { name: "Acts of Kindness or Volunteering", icon: "🤝" },
      { name: "Express Gratitude to Someone", icon: "🙏" },
      { name: "Check In / Encourage an Accountability Buddy", icon: "👋" },
    ],
  },
  {
    label: "Self-Care & Balance",
    habits: [
      { name: "Outdoor Time (Fresh Air, Sunlight, Gentle Walk)", icon: "🌿" },
    ],
  },
  {
    label: "Addiction / Reduction",
    habits: [
      { name: "Porn Addiction (reduction/quit target)", icon: "🚫" },
      { name: "Betting (reduction/quit target)", icon: "🎰" },
      { name: "Doom Scrolling (reduction/quit target)", icon: "📱" },
    ],
  },
];

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

const AddHabitDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✅");
  const [color, setColor] = useState(COLORS[0]);
  const [mode, setMode] = useState<"preset" | "custom">("preset");
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
          setMode("preset");
          setOpen(false);
        },
      }
    );
  };

  const selectPreset = (habit: { name: string; icon: string }) => {
    setName(habit.name);
    setIcon(habit.icon);
    setMode("custom");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gradient-primary hover:opacity-90 px-5">
          <Plus className="w-4 h-4 mr-1" /> Add New Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-primary/20 max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "preset" ? "default" : "outline"}
            onClick={() => setMode("preset")}
            className="flex-1"
          >
            Choose Preset
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "custom" ? "default" : "outline"}
            onClick={() => setMode("custom")}
            className="flex-1"
          >
            Custom
          </Button>
        </div>

        {mode === "preset" ? (
          <ScrollArea className="h-96 pr-2">
            <div className="space-y-4">
              {HABIT_CATEGORIES.map((cat) => (
                <div key={cat.label}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.label}</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {cat.habits.map((h) => (
                      <button
                        key={h.name}
                        type="button"
                        onClick={() => selectPreset(h)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm hover:bg-secondary/60 transition-colors"
                      >
                        <span className="text-lg">{h.icon}</span>
                        <span>{h.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-96 pr-2">
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
                <div className="grid grid-cols-8 gap-2">
                  {ICONS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIcon(i)}
                      className={`text-xl p-1.5 rounded-lg transition-smooth ${
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
                <div className="grid grid-cols-8 gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 rounded-lg transition-smooth ${
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
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddHabitDialog;
