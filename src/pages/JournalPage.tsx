import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Trash2, Calendar as CalendarIcon, Sparkles, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useReflections, useSaveReflection, useHabits, useAllCompletions } from "@/hooks/useHabits";

const motivationalQuotes = [
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "The best way to predict the future is to create it.",
  "You are never too old to set another goal or to dream a new dream.",
  "Believe you can and you're halfway there.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
];

const moods = ["😄", "😊", "😐", "😢", "😠"];

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const JournalPage = () => {
  const { data: reflections = [], isLoading } = useReflections();
  const saveReflection = useSaveReflection();
  const { data: habits = [] } = useHabits();
  const { data: allCompletions = [] } = useAllCompletions();

  const [motivation] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  const [entryHeading, setEntryHeading] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [dailyReflection, setDailyReflection] = useState("");
  const [mistakesReflection, setMistakesReflection] = useState("");
  const [successSteps, setSuccessSteps] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [browsingDate, setBrowsingDate] = useState<Date>(new Date());

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
      setNewTodo("");
    }
  };

  const handleDeleteTodo = (id: number) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  const handleToggleTodo = (id: number) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleSaveJournal = () => {
    if (!entryHeading.trim()) {
      toast.error("Please add a heading for your journal entry.");
      return;
    }

    if (!dailyReflection.trim()) {
      toast.error("Your daily reflection cannot be empty.");
      return;
    }

    const fullEntry = [
      entryHeading ? `Heading: ${entryHeading}` : "",
      mood ? `Mood: ${mood}` : "",
      dailyReflection,
      mistakesReflection ? `\n---\nReflections: ${mistakesReflection}` : "",
      successSteps ? `\n---\nNext Steps: ${successSteps}` : "",
      todos.length > 0
        ? `\n---\nTodos:\n${todos.map((t) => `${t.completed ? "✅" : "⬜"} ${t.text}`).join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    saveReflection.mutate(fullEntry, {
      onSuccess: () => {
        setEntryHeading("");
        setDailyReflection("");
        setMistakesReflection("");
        setSuccessSteps("");
        setMood(null);
        setTodos([]);
      },
    });
  };

  // Filter reflections by browsing date
  const filteredReflections = useMemo(() => {
    const dateStr = format(browsingDate, "yyyy-MM-dd");
    return reflections.filter((r) => r.reflection_date === dateStr);
  }, [reflections, browsingDate]);

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(browsingDate);
    newDate.setDate(newDate.getDate() - 1);
    setBrowsingDate(newDate);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(browsingDate);
    newDate.setDate(newDate.getDate() + 1);
    setBrowsingDate(newDate);
  };

  // Parse journal content to extract structured data
  const parseJournalContent = (content: string) => {
    const lines = content.split("\n");
    let heading = "";
    let mood = null;
    let dailyReflection = "";
    let mistakes = "";
    let steps = "";
    let todos: Array<{ text: string; completed: boolean }> = [];

    for (const line of lines) {
      if (line.startsWith("Heading: ")) {
        heading = line.replace("Heading: ", "").trim();
      } else if (line.startsWith("Mood: ")) {
        mood = line.replace("Mood: ", "").trim();
      } else if (line.startsWith("---")) {
        continue;
      } else if (line.startsWith("Reflections: ")) {
        mistakes = line.replace("Reflections: ", "").trim();
      } else if (line.startsWith("Next Steps: ")) {
        steps = line.replace("Next Steps: ", "").trim();
      } else if (line.startsWith("Todos:")) {
        continue;
      } else if (line.startsWith("✅") || line.startsWith("⬜")) {
        const completed = line.startsWith("✅");
        const text = line.substring(2).trim();
        todos.push({ text, completed });
      } else if (line.trim()) {
        dailyReflection += line + "\n";
      }
    }

    return { heading, mood, dailyReflection, mistakes, steps, todos };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Journal</h1>
        <p className="text-muted-foreground">Daily reflections and thoughts</p>
      </div>

      {/* Motivation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="gradient-hero text-foreground border-0 shadow-primary-glow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Daily Motivation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg italic">"{motivation}"</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Entry Heading */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Entry Heading</CardTitle>
            <CardDescription>Give your journal entry a title</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={entryHeading}
              onChange={(e) => setEntryHeading(e.target.value)}
              placeholder="e.g., A Great Day at Work, Weekend Reflections..."
              className="bg-secondary/30 border-border text-lg font-medium"
              required
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Mood */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>How are you feeling today?</CardTitle>
            <CardDescription>Select a mood that best describes your day.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-around">
            {moods.map((m) => (
              <Button
                key={m}
                variant={mood === m ? "default" : "outline"}
                size="icon"
                onClick={() => setMood(m)}
                className={`text-2xl rounded-full w-12 h-12 transition-smooth ${mood === m ? "scale-125 gradient-primary border-0" : ""
                  }`}
              >
                {m}
              </Button>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Reflection */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Write About Your Day</CardTitle>
            <CardDescription>What was great? What could be better?</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={dailyReflection}
              onChange={(e) => setDailyReflection(e.target.value)}
              placeholder="Start writing your daily reflection..."
              className="min-h-[150px] bg-secondary/30 border-border resize-none"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Todos + Reflections Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>To-Do List</CardTitle>
              <CardDescription>Key tasks for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                  placeholder="Add a new task..."
                  className="bg-secondary/30 border-border"
                />
                <Button onClick={handleAddTodo} size="icon" className="gradient-primary border-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {todos.map((todo) => (
                  <div key={todo.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/30 transition-smooth">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={todo.completed} onCheckedChange={() => handleToggleTodo(todo.id)} />
                      <span className={`text-sm ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                        {todo.text}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTodo(todo.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                {todos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks added yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Mistakes & Reflection</CardTitle>
                <CardDescription>What went wrong? What did you learn?</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={mistakesReflection}
                  onChange={(e) => setMistakesReflection(e.target.value)}
                  placeholder="Reflect on setbacks or challenges..."
                  className="bg-secondary/30 border-border resize-none"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Steps Towards Success</CardTitle>
                <CardDescription>Concrete solutions and next actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={successSteps}
                  onChange={(e) => setSuccessSteps(e.target.value)}
                  placeholder="Outline your plan to improve..."
                  className="bg-secondary/30 border-border resize-none"
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSaveJournal}
          size="lg"
          className="gradient-primary hover:opacity-90 px-8"
          disabled={saveReflection.isPending}
        >
          {saveReflection.isPending ? "Saving..." : "Save Today's Journal"}
        </Button>
      </div>

      {/* Past Entries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Past Entries</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[260px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(browsingDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={browsingDate}
                onSelect={(d) => d && setBrowsingDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="relative">
          {/* Navigation Arrows - Always Visible */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousDay}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 hover:bg-background border border-border"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextDay}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 hover:bg-background border border-border"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Entry Display Content */}
          <div className="px-16">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading entries...</p>
            ) : filteredReflections.length === 0 ? (
              <Card className="glass border-border/50">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No entries for {format(browsingDate, "MMMM dd, yyyy")}</p>
                </CardContent>
              </Card>
            ) : (
              filteredReflections.map((entry) => {
                const parsed = parseJournalContent(entry.content);
                const dateStr = format(browsingDate, "yyyy-MM-dd");
                const dayCompletions = allCompletions.filter(c => c.completion_date === dateStr);
                const completedHabitIds = new Set(dayCompletions.map(c => c.habit_id));

                return (
                  <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className="glass border-border/50">
                      <CardContent className="p-6">
                        {/* Header with Date, Time, Mood, and Delete */}
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-semibold">
                                {format(new Date(entry.reflection_date), "EEEE, MMMM dd, yyyy")}
                              </h3>
                              {parsed.mood && (
                                <span className="text-3xl">{parsed.mood}</span>
                              )}
                            </div>
                            {parsed.heading && (
                              <h2 className="text-2xl font-bold text-primary mb-2 mt-3">
                                {parsed.heading}
                              </h2>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(entry.created_at), "hh:mm:ss a")}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gradient-danger"
                          >
                            Delete
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Left Column - Reflections */}
                          <div className="space-y-4">
                            {parsed.dailyReflection && (
                              <div>
                                <h4 className="font-semibold mb-2">Daily Reflection</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {parsed.dailyReflection}
                                </p>
                              </div>
                            )}

                            {parsed.mistakes && (
                              <div>
                                <h4 className="font-semibold mb-2">Mistakes and Reflection</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {parsed.mistakes}
                                </p>
                              </div>
                            )}

                            {parsed.steps && (
                              <div>
                                <h4 className="font-semibold mb-2">Steps Towards Success</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {parsed.steps}
                                </p>
                              </div>
                            )}

                            {parsed.todos.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">To-Do List</h4>
                                <div className="space-y-1">
                                  {parsed.todos.map((todo, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm">
                                      {todo.completed ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <X className="h-4 w-4 text-red-500" />
                                      )}
                                      <span className={todo.completed ? "line-through text-muted-foreground" : ""}>
                                        {todo.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Column - Habits */}
                          <div>
                            <h4 className="font-semibold mb-3">Habits on this day</h4>
                            <div className="space-y-2">
                              {habits.map((habit) => {
                                const isCompleted = completedHabitIds.has(habit.id);
                                return (
                                  <div
                                    key={habit.id}
                                    className="flex items-center gap-2 p-2 rounded-md bg-secondary/20"
                                  >
                                    {isCompleted ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <X className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="text-lg">{habit.icon}</span>
                                    <span className="text-sm">{habit.name}</span>
                                  </div>
                                );
                              })}
                              {habits.length === 0 && (
                                <p className="text-sm text-muted-foreground">No habits tracked</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalPage;
