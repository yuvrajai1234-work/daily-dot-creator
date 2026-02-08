import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, Flame, Trophy, TrendingUp, Plus, Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const mockHabits = [
  { id: 1, name: "Morning Meditation", icon: "🧘", color: "hsl(262, 83%, 45%)", streak: 12, completed: true },
  { id: 2, name: "Exercise", icon: "💪", color: "hsl(142, 76%, 36%)", streak: 7, completed: false },
  { id: 3, name: "Read 30 mins", icon: "📚", color: "hsl(38, 92%, 50%)", streak: 21, completed: true },
  { id: 4, name: "Drink Water", icon: "💧", color: "hsl(200, 80%, 50%)", streak: 30, completed: false },
  { id: 5, name: "Journal", icon: "✍️", color: "hsl(310, 70%, 50%)", streak: 5, completed: true },
  { id: 6, name: "No Social Media", icon: "📵", color: "hsl(0, 84%, 60%)", streak: 3, completed: false },
];

const weeklyData = [
  { day: "Mon", completion: 80 },
  { day: "Tue", completion: 65 },
  { day: "Wed", completion: 90 },
  { day: "Thu", completion: 75 },
  { day: "Fri", completion: 85 },
  { day: "Sat", completion: 60 },
  { day: "Sun", completion: 95 },
];

const Dashboard = () => {
  const [habits, setHabits] = useState(mockHabits);
  const [reflection, setReflection] = useState("");

  const toggleHabit = (id: number) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h))
    );
    const habit = habits.find((h) => h.id === id);
    if (habit && !habit.completed) {
      toast.success(`${habit.icon} ${habit.name} completed!`);
    }
  };

  const completedCount = habits.filter((h) => h.completed).length;
  const completionRate = Math.round((completedCount / habits.length) * 100);
  const totalStreak = Math.max(...habits.map((h) => h.streak));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Let's make today count.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Progress", value: `${completionRate}%`, icon: TrendingUp, gradient: "gradient-primary" },
          { label: "Completed", value: `${completedCount}/${habits.length}`, icon: Calendar, gradient: "gradient-success" },
          { label: "Best Streak", value: `${totalStreak} days`, icon: Flame, gradient: "bg-warning" },
          { label: "Achievements", value: "12", icon: Trophy, gradient: "gradient-hero" },
        ].map((stat) => (
          <motion.div key={stat.label} whileHover={{ y: -2 }}>
            <Card className="glass border-border/50 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.gradient} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Habits */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Today's Habits</h2>
            <Button size="sm" className="gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-1" /> Add Habit
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {habits.map((habit) => (
              <motion.div key={habit.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className="cursor-pointer transition-smooth border-border/30 overflow-hidden"
                  style={{
                    background: habit.completed
                      ? `linear-gradient(135deg, ${habit.color}, ${habit.color}88)`
                      : undefined,
                  }}
                  onClick={() => toggleHabit(habit.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{habit.icon}</span>
                        <div>
                          <p className={`font-medium ${habit.completed ? "text-foreground" : ""}`}>
                            {habit.name}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Flame className="w-3 h-3 text-warning" />
                            <span className="text-xs text-muted-foreground">{habit.streak} day streak</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-smooth ${
                          habit.completed
                            ? "bg-foreground/20 border-foreground/40"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {habit.completed && <Check className="w-4 h-4" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Weekly Chart */}
          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Weekly Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 3.7%, 15.9%)" />
                  <XAxis dataKey="day" stroke="hsl(240, 5%, 64.9%)" fontSize={12} />
                  <YAxis stroke="hsl(240, 5%, 64.9%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(240, 10%, 6%)",
                      border: "1px solid hsl(240, 3.7%, 15.9%)",
                      borderRadius: "8px",
                      color: "hsl(0, 0%, 98%)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completion"
                    stroke="hsl(262, 83%, 58%)"
                    fillOpacity={1}
                    fill="url(#colorCompletion)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Reflection */}
          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Daily Reflection</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="How was your day? What did you learn?"
                className="min-h-[100px] bg-secondary/30 border-border resize-none"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
              />
              <Button
                className="w-full mt-3 gradient-primary hover:opacity-90"
                size="sm"
                onClick={() => {
                  toast.success("Reflection saved!");
                  setReflection("");
                }}
              >
                Save Reflection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
