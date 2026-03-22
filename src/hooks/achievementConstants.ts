import { Shield, Star, Zap, Crown, Trophy, Target, BookOpen, Flame, Users, Calendar, Award } from "lucide-react";

export const RARITY_CONFIG: Record<string, { label: string; color: string; glow: string; gradient: string; border: string; icon: any }> = {
  common: {
    label: "Common",
    color: "text-slate-600 dark:text-slate-300",
    glow: "",
    gradient: "from-slate-600 to-slate-700",
    border: "border-slate-500/40",
    icon: Shield,
  },
  rare: {
    label: "Rare",
    color: "text-blue-600 dark:text-blue-400",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    gradient: "from-blue-600 to-blue-800",
    border: "border-blue-500/50",
    icon: Star,
  },
  epic: {
    label: "Epic",
    color: "text-purple-600 dark:text-purple-400",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    gradient: "from-purple-600 to-purple-900",
    border: "border-purple-500/60",
    icon: Zap,
  },
  legendary: {
    label: "Legendary",
    color: "text-amber-600 dark:text-amber-400",
    glow: "shadow-[0_0_30px_rgba(251,191,36,0.5)]",
    gradient: "from-amber-500 to-amber-800",
    border: "border-amber-500/70",
    icon: Crown,
  },
};

export const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  all: { label: "All", icon: Trophy, color: "" },
  beginner: { label: "🌱 Beginner", icon: Shield, color: "text-green-400" },
  intermediate: { label: "💪 Intermediate", icon: Target, color: "text-blue-400" },
  advanced: { label: "⚡ Advanced", icon: Zap, color: "text-purple-400" },
  streak: { label: "🔥 Streaks", icon: Flame, color: "text-orange-400" },
  habits: { label: "🎯 Habits", icon: Target, color: "text-cyan-400" },
  reflection: { label: "✍️ Reflection", icon: BookOpen, color: "text-pink-400" },
  level: { label: "⭐ Leveling", icon: Star, color: "text-yellow-400" },
  community: { label: "👥 Community", icon: Users, color: "text-indigo-400" },
  consistency: { label: "📅 Consistency", icon: Calendar, color: "text-teal-400" },
  milestone: { label: "🏆 Milestones", icon: Award, color: "text-amber-400" },
  elite: { label: "👑 Elite", icon: Crown, color: "text-rose-400" },
};

export const YEAR_OPTIONS = [
  { value: "all", label: "All Years", emoji: "🗓️" },
  { value: "1", label: "Year 1 — The Beginning", emoji: "🌱" },
  { value: "2", label: "Year 2 — Building Momentum", emoji: "💪" },
  { value: "3", label: "Year 3 — Rising Power", emoji: "⚡" },
  { value: "4", label: "Year 4 — Elite Territory", emoji: "👑" },
  { value: "5", label: "Year 5 — Legendary Status", emoji: "🌌" },
];

export const getStatValue = (stats: any, reqType: string): number => {
  if (!stats) return 0;
  switch (reqType) {
    case "total_completions": return stats.totalCompletions;
    case "streak": return stats.bestStreak;
    case "current_streak": return stats.currentStreak;
    case "total_habits": return stats.totalHabits;
    case "total_reflections": return stats.totalReflections;
    case "level": return stats.level;
    case "total_xp": return stats.totalXP;
    case "days_active": return stats.daysActive;
    case "community_posts": return stats.communityPosts;
    default: return 0;
  }
};

export const getAchievementProgress = (achievement: { requirement_type: string; requirement_value: number }, stats: any) => {
  const current = getStatValue(stats, achievement.requirement_type);
  return Math.min(Math.round((current / achievement.requirement_value) * 100), 100);
};
