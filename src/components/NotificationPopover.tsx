import { Bell, Gift, Flame, Trophy, Clock, CheckCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { useClaimACoins, useClaimBCoins } from "@/hooks/useCoins";
import { useNavigate } from "react-router-dom";

const typeIcon = (type: AppNotification["type"]) => {
  switch (type) {
    case "quest": return <Gift className="w-4 h-4 text-warning" />;
    case "streak": return <Flame className="w-4 h-4 text-warning" />;
    case "achievement": return <Trophy className="w-4 h-4 text-primary" />;
    case "reward": return <Gift className="w-4 h-4 text-primary" />;
    case "reminder": return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

const NotificationPopover = () => {
  const { notifications, claimableCount } = useNotifications();
  const navigate = useNavigate();
  const claimACoins = useClaimACoins();
  const claimBCoins = useClaimBCoins();

  const handleClaim = (notif: AppNotification) => {
    if (!notif.claimReward) return;

    if (notif.type === "achievement") {
      // Achievement claims give A coins
      const achievementId = notif.id.replace("achievement-", "");
      claimACoins.mutate({ amount: notif.claimReward, achievementId });
    } else {
      // Quests, streaks, daily engagement give B coins
      claimBCoins.mutate({ amount: notif.claimReward });
    }
  };

  const getCoinLabel = (notif: AppNotification) => {
    return notif.type === "achievement" ? "A Coins" : "B Coins";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-secondary/50 transition-smooth relative">
          <Bell className="w-4 h-4 text-muted-foreground hover:text-foreground transition-smooth" />
          {claimableCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
              {claimableCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-card border-border/50 backdrop-blur-xl"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {claimableCount > 0 && (
            <span className="text-xs text-warning font-medium">
              {claimableCount} claimable
            </span>
          )}
        </div>

        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-smooth"
                >
                  <span className="text-xl mt-0.5">{notif.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {typeIcon(notif.type)}
                      <p className="text-sm font-medium truncate">{notif.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notif.description}
                    </p>
                    {notif.claimable && notif.claimReward && (
                      <div className="mt-1.5">
                        <Button
                          size="sm"
                          className="h-6 text-xs px-2 gradient-primary hover:opacity-90 gap-1"
                          disabled={claimACoins.isPending || claimBCoins.isPending}
                          onClick={() => handleClaim(notif)}
                        >
                          <CheckCircle className="w-3 h-3" />
                          Claim +{notif.claimReward} {getCoinLabel(notif)}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-2 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/inbox")}
          >
            View all in Inbox →
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
