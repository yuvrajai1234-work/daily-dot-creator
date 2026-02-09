import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Flame, Trophy, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardsProps {
  todayScore: number;
  currentStreak: number;
  cycleScore: number;
  improvement: number;
}

const StatsCards = ({ todayScore, currentStreak, cycleScore, improvement }: StatsCardsProps) => {
  const stats = [
    { label: "Today's Score", value: `${todayScore}`, icon: Calendar, color: "text-primary" },
    { label: "Current Streak", value: `${currentStreak} Days`, icon: Flame, color: "text-warning" },
    { label: "Cycle Score", value: `${cycleScore}`, icon: Trophy, color: "text-primary" },
    { label: "Improvement", value: `${improvement >= 0 ? "+" : ""}${improvement}%`, icon: TrendingUp, color: "text-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="border-border/50 bg-card hover:border-primary/30 transition-smooth">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
