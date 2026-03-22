import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock, CheckCircle, Star, Zap, Crown, Shield, Flame, Target, BookOpen, Users, Calendar, TrendingUp, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAchievements, useUserAchievements, useUserStats } from "@/hooks/useAchievements";
import { useClaimACoins } from "@/hooks/useCoins";
import { useProfile } from "@/hooks/useProfile";
import { useMemo, useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RARITY_CONFIG, CATEGORY_CONFIG, YEAR_OPTIONS, getStatValue, getAchievementProgress } from "@/hooks/achievementConstants";
import { YearDropdown } from "@/components/YearDropdown";

const YEAR_BADGE: Record<number, { label: string; color: string }> = {
  1: { label: "Year 1", color: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30" },
  2: { label: "Year 2", color: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  3: { label: "Year 3", color: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  4: { label: "Year 4", color: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  5: { label: "Year 5", color: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30" },
};

// ─── Progress calculation helper ──────────────────────────────────────────────

// ─── Confetti particle animation ──────────────────────────────────────────────
const Particle = ({ color }: { color: string }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full"
    style={{ background: color }}
    initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
    animate={{
      opacity: 0,
      scale: 0,
      x: (Math.random() - 0.5) * 120,
      y: (Math.random() - 0.5) * 120,
    }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  />
);

// ─── Achievement Card Component ───────────────────────────────────────────────
const AchievementCard = ({
  achievement,
  earned,
  progress,
  canClaim,
  onClaim,
  isClaiming,
  index,
}: {
  achievement: any;
  earned: boolean;
  progress: number;
  canClaim: boolean;
  onClaim: () => void;
  isClaiming: boolean;
  index: number;
}) => {
  const [showParticles, setShowParticles] = useState(false);
  const rarity = achievement.rarity || "common";
  const yearTarget = achievement.year_target;
  const rc = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  const RarityIcon = rc.icon;

  const handleClaim = () => {
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1000);
    onClaim();
  };

  return (
    <motion.div
      key={achievement.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5), type: "spring", stiffness: 100 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative"
    >
      {/* Particles on claim */}
      {showParticles && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          {["#fbbf24", "#a855f7", "#3b82f6", "#22c55e", "#f43f5e"].map((c, i) => (
            <Particle key={i} color={c} />
          ))}
        </div>
      )}

      <Card
        className={`glass overflow-hidden transition-all duration-300 ${rc.border} ${earned ? `${rc.glow}` : canClaim ? "border-primary/60 animate-pulse-glow" : ""
          }`}
      >
        {/* Rarity top accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${rc.gradient}`} />

        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <span className={`text-3xl ${!earned && !canClaim ? "grayscale opacity-40" : ""}`}>
                  {achievement.icon}
                </span>
                {earned && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center"
                  >
                    <CheckCircle className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-tight">{achievement.name}</h3>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  <RarityIcon className={`w-3 h-3 ${rc.color}`} />
                  <span className={`text-xs font-medium ${rc.color}`}>{rc.label}</span>
                  {yearTarget && YEAR_BADGE[yearTarget] && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${YEAR_BADGE[yearTarget].color}`}>
                      {YEAR_BADGE[yearTarget].label}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {earned ? (
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            ) : (
              <Lock className={`w-4 h-4 flex-shrink-0 mt-0.5 ${canClaim ? "text-primary" : "text-muted-foreground"}`} />
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed">{achievement.description}</p>

          {/* Rewards row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300">
              +{achievement.coin_reward} A Coins
            </Badge>
            {achievement.xp_reward && (
              <Badge variant="outline" className="text-xs bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300">
                +{achievement.xp_reward} XP
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className={earned ? "text-success font-medium" : progress > 0 ? "text-foreground" : "text-muted-foreground"}>
                {progress}%
              </span>
            </div>
            <div className="relative h-2 bg-secondary/60 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${earned ? "from-success to-emerald-400" : canClaim ? "from-primary to-blue-400" : rc.gradient
                  }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>

          {/* Claim button */}
          {canClaim && (
            <Button
              className="w-full gradient-primary hover:opacity-90 text-xs h-8"
              size="sm"
              disabled={isClaiming}
              onClick={handleClaim}
            >
              <Trophy className="w-3 h-3 mr-1" />
              Claim {achievement.coin_reward} A Coins
            </Button>
          )}

          {earned && (
            <p className="text-xs text-success text-center font-medium flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" /> Unlocked!
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ─── Main Achievements Page ───────────────────────────────────────────────────
const AchievementsPage = () => {
  const { data: achievements = [], isLoading: achievementsLoading } = useAchievements();
  const { data: userAchievements = [], isLoading: userAchievementsLoading } = useUserAchievements();
  const { data: stats } = useUserStats();
  const { data: profile } = useProfile();
  const claimACoins = useClaimACoins();
  const [activeTab, setActiveTab] = useState("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const aCoins = (profile as any)?.a_coin_balance || 0;

  const earnedIds = useMemo(
    () => new Set(userAchievements.map((ua) => ua.achievement_id)),
    [userAchievements]
  );

  const getProgress = (achievement: any) => getAchievementProgress(achievement, stats);

  const isClaimable = (achievement: { requirement_type: string; requirement_value: number }) =>
    getProgress(achievement) >= 100;

  const categories = useMemo(() => {
    const cats = new Set(achievements.map((a) => a.category));
    return ["all", ...Array.from(cats)];
  }, [achievements]);

  const filtered = useMemo(() => {
    let list = activeTab === "all" ? achievements : achievements.filter((a) => a.category === activeTab);
    if (rarityFilter !== "all") list = list.filter((a) => (a.rarity || "common") === rarityFilter);
    if (yearFilter !== "all") list = list.filter((a) => String((a as any).year_target || 1) === yearFilter);
    if (statusFilter !== "all") {
      if (statusFilter === "completed") list = list.filter((a) => earnedIds.has(a.id));
      else if (statusFilter === "not_completed") list = list.filter((a) => !earnedIds.has(a.id));
    }
    return list;
  }, [achievements, activeTab, rarityFilter, yearFilter, statusFilter, earnedIds]);

  // Sort: claimable first, then by progress desc, then locked
  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aEarned = earnedIds.has(a.id);
      const bEarned = earnedIds.has(b.id);
      const aClaimable = isClaimable(a) && !aEarned;
      const bClaimable = isClaimable(b) && !bEarned;
      if (aClaimable && !bClaimable) return -1;
      if (!aClaimable && bClaimable) return 1;
      if (!aEarned && bEarned) return -1;
      if (aEarned && !bEarned) return 1;
      return getProgress(b) - getProgress(a);
    });
  }, [filtered, earnedIds, stats]);

  // Next-to-unlock achievements (closest to completion, not yet earned)
  const nextToUnlock = useMemo(() => {
    return achievements
      .filter((a) => !earnedIds.has(a.id) && getProgress(a) > 0)
      .sort((a, b) => getProgress(b) - getProgress(a))
      .slice(0, 3);
  }, [achievements, earnedIds, stats]);

  // Stats summary
  const totalACoinsEarned = useMemo(
    () => achievements.filter((a) => earnedIds.has(a.id)).reduce((sum, a) => sum + a.coin_reward, 0),
    [achievements, earnedIds]
  );
  const completionPct = achievements.length > 0 ? Math.round((userAchievements.length / achievements.length) * 100) : 0;

  // Year breakdown
  const yearBreakdown = useMemo(() => {
    const map: Record<number, { total: number; earned: number }> = {};
    achievements.forEach((a) => {
      const yr = (a as any).year_target || 1;
      if (!map[yr]) map[yr] = { total: 0, earned: 0 };
      map[yr].total++;
      if (earnedIds.has(a.id)) map[yr].earned++;
    });
    return map;
  }, [achievements, earnedIds]);

  if (achievementsLoading || userAchievementsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Trophy className="w-8 h-8 text-amber-400" />
          <h1 className="text-3xl font-bold">Achievements</h1>
        </div>
        <p className="text-muted-foreground">
          Your 5-year journey of habits, growth & mastery — {achievements.length} milestones await. 🚀
        </p>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Unlocked",
            value: `${userAchievements.length}/${achievements.length}`,
            icon: Trophy,
            gradient: "from-amber-500 to-amber-700",
          },
          {
            label: "A Coins Earned",
            value: totalACoinsEarned,
            icon: Star,
            gradient: "from-violet-500 to-violet-700",
          },
          {
            label: "Completion",
            value: `${completionPct}%`,
            icon: TrendingUp,
            gradient: "from-emerald-500 to-emerald-700",
          },
          {
            label: "A Coins Balance",
            value: aCoins,
            icon: Award,
            gradient: "from-blue-500 to-blue-700",
          },
        ].map((stat) => (
          <Card key={stat.label} className="glass border-border/50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold truncate">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── 5-Year Roadmap ── */}
      {Object.keys(yearBreakdown).length > 0 && (
        <Card className="glass border-border/50 overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">5-Year Journey Roadmap</h2>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {([1, 2, 3, 4, 5] as const).map((yr) => {
                const data = yearBreakdown[yr] || { total: 0, earned: 0 };
                const pct = data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0;
                const { color } = YEAR_BADGE[yr];
                return (
                  <div key={yr} className="text-center space-y-1.5">
                    <div className={`text-xs font-medium px-2 py-1 rounded border ${color}`}>
                      Year {yr}
                    </div>
                    <div className="text-xs text-muted-foreground">{data.earned}/{data.total}</div>
                    <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${yr === 1 ? "from-green-500 to-emerald-400" :
                          yr === 2 ? "from-blue-500 to-cyan-400" :
                            yr === 3 ? "from-purple-500 to-violet-400" :
                              yr === 4 ? "from-amber-500 to-yellow-400" :
                                "from-rose-500 to-pink-400"
                          }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: yr * 0.1 }}
                      />
                    </div>
                    <div className="text-xs font-medium">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Next to Unlock spotlight ── */}
      {nextToUnlock.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" /> Almost There — Next to Unlock
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {nextToUnlock.map((a) => {
              const prog = getProgress(a);
              const rc = RARITY_CONFIG[(a as any).rarity || "common"];
              return (
                <motion.div key={a.id} whileHover={{ scale: 1.02 }} className="relative">
                  <Card className={`glass ${rc.border} ${rc.glow} overflow-hidden`}>
                    <div className={`h-0.5 w-full bg-gradient-to-r ${rc.gradient}`} />
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="text-2xl">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <div className="mt-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${rc.gradient}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${prog}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{prog}% complete</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Rarity, Status + Year filters row ── */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Rarity pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Rarity:</span>
          {["all", "common", "rare", "epic", "legendary"].map((r) => {
            const rc = r !== "all" ? RARITY_CONFIG[r] : null;
            return (
              <button
                key={r}
                onClick={() => setRarityFilter(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${rarityFilter === r
                  ? rc
                    ? `bg-gradient-to-r ${rc.gradient} border-transparent text-white`
                    : "bg-primary text-primary-foreground border-transparent"
                  : "border-border/50 text-muted-foreground hover:border-border"
                  }`}
              >
                {r !== "all" && rc ? <span className={rc.color}>{rc.label}</span> : "All Rarities"}
              </button>
            );
          })}
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Status:</span>
          {[
            { id: "all", label: "All Status" },
            { id: "completed", label: "Completed" },
            { id: "not_completed", label: "Not Completed" }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${statusFilter === s.id
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-border/50 text-muted-foreground hover:border-border"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Year dropdown */}
        <div className="flex items-center gap-2 ml-auto">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Year:</span>
          <YearDropdown value={yearFilter} onChange={setYearFilter} />
        </div>
      </div>

      {/* ── Category Tabs + Grid ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1 mb-4">
          {categories.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs"
              >
                {cfg ? cfg.label : cat}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {sortedFiltered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No achievements in this category yet.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + rarityFilter + yearFilter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {sortedFiltered.map((achievement, i) => {
                  const earned = earnedIds.has(achievement.id);
                  const progress = getProgress(achievement);
                  const canClaim = isClaimable(achievement) && !earned;

                  return (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      earned={earned}
                      progress={progress}
                      canClaim={canClaim}
                      isClaiming={claimACoins.isPending}
                      index={i}
                      onClaim={() =>
                        claimACoins.mutate({ amount: achievement.coin_reward, achievementId: achievement.id })
                      }
                    />
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementsPage;
