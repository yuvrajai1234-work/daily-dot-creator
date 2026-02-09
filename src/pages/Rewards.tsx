import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, ShoppingBag, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useSpendACoins } from "@/hooks/useCoins";

const rewards = [
  { id: 1, name: "Custom Theme", description: "Unlock a custom color theme for your dashboard", cost: 50, icon: "🎨", category: "Customization", coinType: "A" as const },
  { id: 2, name: "Profile Badge", description: "Show off a special badge on your profile", cost: 100, icon: "🏅", category: "Badges", coinType: "A" as const },
  { id: 3, name: "Streak Shield", description: "Protect your streak for one missed day", cost: 200, icon: "🛡️", category: "Power-ups", coinType: "A" as const },
  { id: 4, name: "Premium Sounds", description: "Unlock premium notification sounds", cost: 75, icon: "🔔", category: "Customization", coinType: "A" as const },
  { id: 5, name: "Avatar Frame", description: "Get a golden frame around your avatar", cost: 150, icon: "👑", category: "Customization", coinType: "A" as const },
  { id: 6, name: "Double XP Weekend", description: "Earn double points for the next weekend", cost: 300, icon: "⚡", category: "Power-ups", coinType: "A" as const },
  { id: 7, name: "E-book Access", description: "Unlock a premium self-improvement e-book", cost: 250, icon: "📚", category: "Content", coinType: "A" as const },
  { id: 8, name: "Mentor Session", description: "Get a 15-minute session with a habit coach", cost: 500, icon: "🎓", category: "Premium", coinType: "A" as const },
];

const RewardsPage = () => {
  const { data: profile } = useProfile();
  const spendACoins = useSpendACoins();

  const aCoins = (profile as any)?.a_coin_balance || 0;
  const pCoins = (profile as any)?.p_coin_balance || 0;

  const handleRedeem = (reward: typeof rewards[0]) => {
    spendACoins.mutate(
      { amount: reward.cost },
      { onSuccess: () => {} }
    );
  };

  const canAfford = (cost: number) => aCoins >= cost || pCoins >= cost;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rewards</h1>
        <p className="text-muted-foreground">Spend A Coins (from achievements) or P Coins (premium) on rewards</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="gradient-hero border-0 shadow-primary-glow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">A Coins</p>
              <p className="text-4xl font-bold mt-1">{aCoins}</p>
              <p className="text-sm opacity-70 mt-2">Earned from achievements</p>
            </div>
            <span className="text-5xl opacity-30 font-bold">A</span>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-destructive/20 to-destructive/5 border-destructive/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">P Coins</p>
              <p className="text-4xl font-bold mt-1">{pCoins}</p>
              <p className="text-sm opacity-70 mt-2">Premium currency</p>
            </div>
            <span className="text-5xl opacity-30 font-bold">P</span>
          </CardContent>
        </Card>
      </div>

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
                <span className="text-success font-bold">{reward.cost} A Coins</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAfford(reward.cost) || spendACoins.isPending}
                  className="gap-1"
                >
                  {canAfford(reward.cost) ? (
                    <><ShoppingBag className="w-3 h-3" /> Redeem</>
                  ) : (
                    <><Lock className="w-3 h-3" /> Locked</>
                  )}
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
