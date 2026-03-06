import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Flame, Trophy, TrendingUp, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { ImprovementDialog } from "./ImprovementDialog";

interface StatsCardsProps {
  todayScore: number;
  currentStreak: number;
  cycleDay: number;
  improvement: number;
}

const StatsCards = ({ todayScore, currentStreak, cycleDay, improvement }: StatsCardsProps) => {
  const stats = [
    { label: "Today's Score", value: `${todayScore}`, icon: Calendar, color: "text-primary" },
    { label: "Current Streak", value: `${currentStreak} Days`, icon: Flame, color: "text-warning" },
    { label: "Cycle Day", value: `${cycleDay}`, icon: Trophy, color: "text-primary" },
    { label: "Improvement", value: `${improvement >= 0 ? "+" : ""}${improvement}%`, icon: TrendingUp, color: "text-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const isImprovement = stat.label === "Improvement";

        const cardContent = (
          <Card className={`border-border/50 bg-card hover:border-primary/30 transition-smooth h-full ${isImprovement ? 'cursor-pointer group' : ''}`}>
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {isImprovement && (
                    <ChevronRight className="w-6 h-6 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={isImprovement ? "flex" : ""}
          >
            {isImprovement ? (
              <ImprovementDialog trigger={<div className="w-full flex-1">{cardContent}</div>} overallImprovement={improvement} />
            ) : (
              cardContent
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatsCards;
