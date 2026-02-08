import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, ShoppingBag, Sparkles, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const rewards = [
  { id: 1, name: "Custom Theme", description: "Unlock a custom color theme for your dashboard", cost: 50, icon: "🎨", category: "Customization" },
  { id: 2, name: "Profile Badge", description: "Show off a special badge on your profile", cost: 100, icon: "🏅", category: "Badges" },
  { id: 3, name: "Streak Shield", description: "Protect your streak for one missed day", cost: 200, icon: "🛡️", category: "Power-ups" },
  { id: 4, name: "Premium Sounds", description: "Unlock premium notification sounds", cost: 75, icon: "🔔", category: "Customization" },
  { id: 5, name: "Avatar Frame", description: "Get a golden frame around your avatar", cost: 150, icon: "👑", category: "Customization" },
  { id: 6, name: "Double XP Weekend", description: "Earn double points for the next weekend", cost: 300, icon: "⚡", category: "Power-ups" },
  { id: 7, name: "E-book Access", description: "Unlock a premium self-improvement e-book", cost: 250, icon: "📚", category: "Content" },
  { id: 8, name: "Mentor Session", description: "Get a 15-minute session with a habit coach", cost: 500, icon: "🎓", category: "Premium" },
];

const RewardsPage = () => {
  const handleRedeem = (rewardName: string) => {
    toast.success(`🎉 Redeemed "${rewardName}"!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rewards</h1>
        <p className="text-muted-foreground">Redeem your earned coins for awesome rewards</p>
      </div>

      {/* Balance Card */}
      <Card className="gradient-hero border-0 shadow-primary-glow">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Your Balance</p>
            <p className="text-4xl font-bold mt-1">0 Coins</p>
            <p className="text-sm opacity-70 mt-2">Earn coins by completing habits and quests!</p>
          </div>
          <Gift className="w-16 h-16 opacity-30" />
        </CardContent>
      </Card>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rewards.map((reward, i) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -3 }}
          >
            <Card className="glass border-border/50 flex flex-col h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{reward.icon}</span>
                  <Badge variant="outline" className="text-xs">{reward.category}</Badge>
                </div>
                <CardTitle className="text-lg mt-2">{reward.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{reward.description}</p>
              </CardHeader>
              <CardContent className="flex-grow" />
              <CardFooter className="flex items-center justify-between">
                <span className="text-warning font-bold">{reward.cost} coins</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRedeem(reward.name)}
                  className="gap-1"
                >
                  <ShoppingBag className="w-3 h-3" /> Redeem
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RewardsPage;
