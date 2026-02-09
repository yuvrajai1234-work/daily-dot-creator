import { Medal, MessageSquare, Castle } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useUserStats } from "@/hooks/useAchievements";
import { Link } from "react-router-dom";
import NotificationPopover from "@/components/NotificationPopover";

const TopBar = () => {
  const { data: profile } = useProfile();
  const { data: stats } = useUserStats();

  const aCoins = (profile as any)?.a_coin_balance || 0;
  const bCoins = (profile as any)?.b_coin_balance || 0;
  const pCoins = (profile as any)?.p_coin_balance || 0;
  const currentStreak = stats?.bestStreak || 0;

  return (
    <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-border/30 bg-background/80 backdrop-blur-sm">
      {/* Streak */}
      <Link to="/achievements" className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-smooth">
        <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
          <Medal className="w-3.5 h-3.5 text-warning" />
        </div>
        <span className="text-sm font-semibold">{currentStreak}</span>
      </Link>

      {/* A Coins */}
      <Link to="/achievements" className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-smooth">
        <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
          <span className="text-xs font-bold text-success">A</span>
        </div>
        <span className="text-sm font-semibold">{aCoins}</span>
      </Link>

      {/* B Coins */}
      <Link to="/earn-coins" className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-smooth">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">B</span>
        </div>
        <span className="text-sm font-semibold">{bCoins}</span>
      </Link>

      {/* P Coins */}
      <Link to="/rewards" className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-smooth">
        <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
          <span className="text-xs font-bold text-destructive">P</span>
        </div>
        <span className="text-sm font-semibold">{pCoins}</span>
      </Link>

      {/* Divider */}
      <div className="w-px h-5 bg-border/50 mx-1" />

      {/* Community */}
      <Link to="/community" className="p-2 rounded-lg hover:bg-secondary/50 transition-smooth">
        <MessageSquare className="w-4 h-4 text-muted-foreground hover:text-foreground transition-smooth" />
      </Link>

      {/* Notifications Popover */}
      <NotificationPopover />

      {/* Profile */}
      <Link to="/profile" className="p-2 rounded-lg hover:bg-secondary/50 transition-smooth">
        <Castle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-smooth" />
      </Link>
    </div>
  );
};

export default TopBar;
