import { MessageSquare, Castle, Star, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useLevelInfo, getLevelTier, TIERS } from "@/hooks/useXP";
import { Link } from "react-router-dom";
import NotificationPopover from "@/components/NotificationPopover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const TopBar = () => {
  const { data: profile } = useProfile();
  const { data: levelInfo } = useLevelInfo();
  const [showTierDialog, setShowTierDialog] = useState(false);

  const aCoins = (profile as any)?.a_coin_balance || 0;
  const bCoins = (profile as any)?.b_coin_balance || 0;
  const pCoins = (profile as any)?.p_coin_balance || 0;
  const userLevel = levelInfo?.level || 1;
  const currentXP = levelInfo?.currentXP || 0;
  const xpNeeded = levelInfo?.xpNeeded || 100;
  const progress = levelInfo?.progress || 0;
  const tier = getLevelTier(userLevel);

  return (
    <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-border/30 bg-background/80 backdrop-blur-sm">
      {/* XP Progress Bar - Clickable to show tiers */}
      <div
        onClick={() => setShowTierDialog(true)}
        className="flex flex-col gap-0.5 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-smooth min-w-[120px] cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-green-500 font-semibold">
            {currentXP} / {xpNeeded} XP
          </span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: `${tier.color}20`,
              color: tier.color
            }}
          >
            {tier.name}
          </span>
        </div>
        <div className="h-1 bg-secondary/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 bg-[length:200%_100%]"
            initial={{ width: "0%" }}
            animate={{
              width: `${progress}%`,
              backgroundPosition: ["0% 50%", "100% 50%"]
            }}
            transition={{
              width: { type: "spring", stiffness: 40, damping: 15 },
              backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
            }}
          />
        </div>
      </div>

      {/* XP Level */}
      <Link to="/dashboard" className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-smooth">
        <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
        </div>
        <span className="text-sm font-semibold">{userLevel}</span>
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
      {/* Tier Info Dialog */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent className="sm:max-w-[425px] glass border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <span style={{ color: tier.color }}>{tier.name}</span> Level {userLevel}
            </DialogTitle>
            <DialogDescription>
              Your journey to greatness. Earn XP to unlock new tiers!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Current Level Progress */}
            <div className="space-y-2 p-4 rounded-lg bg-secondary/30 border border-white/5">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">Level {userLevel} Progress</span>
                <span className="text-xs text-muted-foreground">{currentXP} / {xpNeeded} XP</span>
              </div>
              <div className="h-3 bg-secondary/50 rounded-full overflow-hidden w-full">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 bg-[length:200%_100%]"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${progress}%`,
                    backgroundPosition: ["0% 50%", "100% 50%"]
                  }}
                  transition={{
                    width: { type: "spring", stiffness: 40, damping: 15 },
                    backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center pt-1">
                {xpNeeded - currentXP} XP needed for next level
              </p>
            </div>

            {/* Tiers List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Castle className="w-4 h-4" /> Level Tiers
              </h4>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {TIERS.slice().reverse().map((t) => (
                    <div
                      key={t.name}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${tier.name === t.name
                          ? 'bg-primary/10 border border-primary/30 shadow-sm'
                          : 'hover:bg-secondary/20 border border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shadow-[0_0_8px]"
                          style={{ backgroundColor: t.color, boxShadow: `0 0 8px ${t.color}` }}
                        />
                        <span className={`text-sm ${tier.name === t.name ? 'font-bold' : ''}`}>
                          {t.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded">
                        Lvl {t.range}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopBar;
