import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Flame, CheckCircle, Clock, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useTodayCompletions } from "@/hooks/useHabits";
import { useUserStats } from "@/hooks/useAchievements";
import { toast } from "sonner";

const InboxPage = () => {
  const { user } = useAuth();
  const { data: todayCompletions = [] } = useTodayCompletions();
  const { data: stats } = useUserStats();
  const [expirationText, setExpirationText] = useState("");

  const hasCompletedHabitToday = todayCompletions.length > 0;
  const currentStreak = stats?.bestStreak || 0;

  // Daily quests
  const quests = useMemo(
    () => [
      {
        id: "login",
        title: "Daily Login",
        description: "Log in to DailyDots",
        reward: 5,
        icon: "🔑",
        completed: true, // Always true since they're viewing this
        claimed: false,
      },
      {
        id: "habit",
        title: "Habit Check-in",
        description: "Complete at least one daily habit",
        reward: 10,
        icon: "✅",
        completed: hasCompletedHabitToday,
        claimed: false,
      },
      {
        id: "reflection",
        title: "Daily Reflection",
        description: "Write a journal entry or reflection",
        reward: 5,
        icon: "📝",
        completed: (stats?.totalReflections || 0) > 0,
        claimed: false,
      },
      {
        id: "community",
        title: "Community Engagement",
        description: "Visit the community page",
        reward: 3,
        icon: "👥",
        completed: false,
        claimed: false,
      },
    ],
    [hasCompletedHabitToday, stats]
  );

  // Streak milestones
  const streakMilestones = [
    { days: 3, reward: 5, label: "3-Day Streak Bonus", icon: "🔥" },
    { days: 7, reward: 10, label: "7-Day Streak Bonus", icon: "⚡" },
    { days: 15, reward: 25, label: "15-Day Streak Bonus", icon: "💫" },
    { days: 30, reward: 50, label: "30-Day Streak Bonus", icon: "🏆" },
  ];

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setExpirationText(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const claimedQuests = quests.filter((q) => q.completed).length;

  const handleClaim = (questTitle: string, reward: number) => {
    toast.success(`🎉 Claimed ${reward} coins from "${questTitle}"!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inbox</h1>
        <p className="text-muted-foreground">Quests and streak rewards</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Target className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quests Done</p>
              <p className="text-xl font-bold">{claimedQuests}/{quests.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center">
              <Flame className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-xl font-bold">{currentStreak} days</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-success flex items-center justify-center">
              <Clock className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resets In</p>
              <p className="text-xl font-bold font-mono">{expirationText}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="quests">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="quests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            🎯 Daily Quests
          </TabsTrigger>
          <TabsTrigger value="streaks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            🔥 Streak Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quests" className="mt-4 space-y-3">
          {quests.map((quest, i) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`glass border-border/50 transition-smooth ${quest.completed ? "border-primary/30" : ""}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{quest.icon}</span>
                    <div>
                      <h3 className="font-bold">{quest.title}</h3>
                      <p className="text-sm text-muted-foreground">{quest.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Gift className="w-3 h-3 text-warning" />
                        <span className="text-xs text-warning font-medium">+{quest.reward} coins</span>
                      </div>
                    </div>
                  </div>
                  {quest.completed ? (
                    <Button
                      className="gradient-primary border-0 hover:opacity-90"
                      size="sm"
                      onClick={() => handleClaim(quest.title, quest.reward)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Claim
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Incomplete
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="streaks" className="mt-4 space-y-3">
          {streakMilestones.map((milestone, i) => {
            const achieved = currentStreak >= milestone.days;
            const progress = Math.min((currentStreak / milestone.days) * 100, 100);

            return (
              <motion.div
                key={milestone.days}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`glass border-border/50 transition-smooth ${achieved ? "border-success/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{milestone.icon}</span>
                        <div>
                          <h3 className="font-bold">{milestone.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            Maintain a {milestone.days}-day streak
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Gift className="w-3 h-3 text-warning" />
                            <span className="text-xs text-warning font-medium">+{milestone.reward} coins</span>
                          </div>
                        </div>
                      </div>
                      {achieved ? (
                        <Button
                          className="gradient-success border-0 hover:opacity-90"
                          size="sm"
                          onClick={() => handleClaim(milestone.label, milestone.reward)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Claim
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          {currentStreak}/{milestone.days}
                        </Badge>
                      )}
                    </div>
                    <Progress value={progress} className="h-2" />
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InboxPage;
