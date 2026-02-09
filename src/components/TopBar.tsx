import { Coins, Medal, Bell, MessageSquare, Castle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useUserAchievements } from "@/hooks/useAchievements";
import { useTodayCompletions } from "@/hooks/useHabits";
import { Link } from "react-router-dom";

const TopBar = () => {
  const { user } = useAuth();
  const { data: achievements = [] } = useUserAchievements();
  const { data: todayCompletions = [] } = useTodayCompletions();

  const streakCount = todayCompletions.length;
  const coinBalance = achievements.length * 10;

  return (
    <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-border/30 bg-background/80 backdrop-blur-sm">
      {/* Streak */}
      <Link to="/achievements" className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-smooth">
        <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
          <Medal className="w-3.5 h-3.5 text-warning" />
        </div>
        <span className="text-sm font-semibold">{streakCount}</span>
      </Link>

      {/* Coins */}
      <Link to="/earn-coins" className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-smooth">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <Coins className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold">{coinBalance}</span>
      </Link>

      {/* Points */}
      <Link to="/rewards" className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-smooth">
        <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
          <span className="text-xs font-bold text-destructive">P</span>
        </div>
        <span className="text-sm font-semibold">0</span>
      </Link>

      {/* Divider */}
      <div className="w-px h-5 bg-border/50 mx-1" />

      {/* Community */}
      <Link to="/community" className="p-2 rounded-lg hover:bg-secondary/50 transition-smooth">
        <MessageSquare className="w-4.5 h-4.5 text-muted-foreground hover:text-foreground transition-smooth" />
      </Link>

      {/* Notifications */}
      <Link to="/inbox" className="p-2 rounded-lg hover:bg-secondary/50 transition-smooth relative">
        <Bell className="w-4.5 h-4.5 text-muted-foreground hover:text-foreground transition-smooth" />
      </Link>

      {/* Profile */}
      <Link to="/profile" className="p-2 rounded-lg hover:bg-secondary/50 transition-smooth">
        <Castle className="w-4.5 h-4.5 text-muted-foreground hover:text-foreground transition-smooth" />
      </Link>
    </div>
  );
};

export default TopBar;
