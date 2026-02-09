import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock, CheckCircle, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { useAchievements, useUserAchievements, useUserStats } from "@/hooks/useAchievements";
import { useClaimACoins } from "@/hooks/useCoins";
import { useProfile } from "@/hooks/useProfile";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categoryLabels: Record<string, string> = {
  beginner: "🌱 Beginner",
  intermediate: "💪 Intermediate",
  advanced: "⚡ Advanced",
  streak: "🔥 Streaks",
  habits: "🎯 Habits",
  reflection: "✍️ Reflection",
};

const AchievementsPage = () => {
  const { data: achievements = [], isLoading: achievementsLoading } = useAchievements();
  const { data: userAchievements = [], isLoading: userAchievementsLoading } = useUserAchievements();
  const { data: stats } = useUserStats();
  const { data: profile } = useProfile();
  const claimACoins = useClaimACoins();
  const [activeTab, setActiveTab] = useState("all");

  const aCoins = (profile as any)?.a_coin_balance || 0;

  const earnedIds = useMemo(
    () => new Set(userAchievements.map((ua) => ua.achievement_id)),
    [userAchievements]
  );

  const getProgress = (achievement: { requirement_type: string; requirement_value: number }) => {
    if (!stats) return 0;
    let current = 0;
    switch (achievement.requirement_type) {
      case "total_completions": current = stats.totalCompletions; break;
      case "streak": current = stats.bestStreak; break;
      case "total_habits": current = stats.totalHabits; break;
      case "total_reflections": current = stats.totalReflections; break;
    }
    return Math.min(Math.round((current / achievement.requirement_value) * 100), 100);
  };

  const isClaimable = (achievement: { requirement_type: string; requirement_value: number }) => {
    return getProgress(achievement) >= 100;
  };

  const categories = useMemo(() => {
    const cats = new Set(achievements.map((a) => a.category));
    return ["all", ...Array.from(cats)];
  }, [achievements]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return achievements;
    return achievements.filter((a) => a.category === activeTab);
  }, [achievements, activeTab]);

  const totalACoinsEarned = useMemo(() => {
    return achievements
      .filter((a) => earnedIds.has(a.id))
      .reduce((sum, a) => sum + a.coin_reward, 0);
  }, [achievements, earnedIds]);

  if (achievementsLoading || userAchievementsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Achievements</h1>
        <p className="text-muted-foreground">Earn A Coins by completing milestones. Use them in the Rewards shop!</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Trophy className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Earned</p>
              <p className="text-2xl font-bold">{userAchievements.length}/{achievements.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">A</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">A Coins Balance</p>
              <p className="text-2xl font-bold">{aCoins}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold">
                {achievements.length > 0
                  ? Math.round((userAchievements.length / achievements.length) * 100)
                  : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All
          </TabsTrigger>
          {categories.filter((c) => c !== "all").map((cat) => (
            <TabsTrigger key={cat} value={cat} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {categoryLabels[cat] || cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((achievement, i) => {
              const earned = earnedIds.has(achievement.id);
              const progress = getProgress(achievement);
              const canClaim = isClaimable(achievement) && !earned;

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3 }}
                >
                  <Card className={`glass border-border/50 overflow-hidden transition-smooth ${
                    earned ? "border-success/40 shadow-success-glow" : canClaim ? "border-primary/40 animate-pulse-glow" : ""
                  }`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-3xl ${!earned && !canClaim ? "grayscale opacity-50" : ""}`}>
                            {achievement.icon}
                          </span>
                          <div>
                            <h3 className="font-semibold">{achievement.name}</h3>
                            <Badge variant="outline" className="text-xs mt-0.5">
                              +{achievement.coin_reward} A Coins
                            </Badge>
                          </div>
                        </div>
                        {earned ? (
                          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        ) : (
                          <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className={earned ? "text-success" : "text-foreground"}>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {canClaim && (
                        <Button
                          className="w-full mt-3 gradient-primary hover:opacity-90"
                          size="sm"
                          disabled={claimACoins.isPending}
                          onClick={() => claimACoins.mutate({ amount: achievement.coin_reward, achievementId: achievement.id })}
                        >
                          🏆 Claim {achievement.coin_reward} A Coins
                        </Button>
                      )}

                      {earned && (
                        <p className="text-xs text-success text-center mt-3 font-medium">
                          ✨ Achievement Unlocked!
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementsPage;
