import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Play, Crown, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useClaimBCoins, getMaxBCoins } from "@/hooks/useCoins";
import { Progress } from "@/components/ui/progress";

const subscriptionPlans = [
  {
    title: "Weekly",
    price: "399",
    coins: "100 P Coins",
    features: ["100 P Coins", "Ad-Free Experience", "Exclusive Badge"],
  },
  {
    title: "Monthly",
    price: "1199",
    coins: "500 P Coins",
    recommended: true,
    features: ["500 P Coins", "Ad-Free Experience", "Exclusive Badge", "Premium Content Access"],
  },
  {
    title: "6 Months",
    price: "6399",
    coins: "3000 P Coins",
    features: ["3000 P Coins", "Everything in Monthly", "Bonus Event Coins"],
  },
  {
    title: "Yearly",
    price: "11999",
    coins: "7000 P Coins",
    features: ["7000 P Coins", "Everything in 6 Months", "Early Access to Features"],
  },
];

const EarnCoinsPage = () => {
  const [adViews, setAdViews] = useState(0);
  const maxAds = 5;
  const { data: profile } = useProfile();
  const claimBCoins = useClaimBCoins();

  const bCoins = (profile as any)?.b_coin_balance || 0;
  const bLevel = (profile as any)?.level || 1;
  const maxB = getMaxBCoins(bLevel);
  const bProgress = Math.round((bCoins / maxB) * 100);

  const handleWatchAd = () => {
    if (adViews >= maxAds) return;
    setAdViews(adViews + 1);
    claimBCoins.mutate({ amount: 10 });
  };

  return (
    <div className="space-y-8">
      {/* B Coin Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">B</span>
                  </span>
                  B Coins
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Level {bLevel} • Resets weekly • Max {maxB}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{bCoins}</p>
                <p className="text-xs text-muted-foreground">/ {maxB}</p>
              </div>
            </div>
            <Progress value={bProgress} className="h-3" />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <Badge variant="outline" className="justify-start gap-2 py-1.5 text-muted-foreground bg-background/50 hover:bg-background transition-colors">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span>Log habit: <span className="font-semibold text-foreground">10 B Coins</span></span>
              </Badge>
              <Badge variant="outline" className="justify-start gap-2 py-1.5 text-muted-foreground bg-background/50 hover:bg-background transition-colors">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span>Save journal: <span className="font-semibold text-foreground">5 B Coins</span></span>
              </Badge>
              <Badge variant="outline" className="justify-start gap-2 py-1.5 text-muted-foreground bg-background/50 hover:bg-background transition-colors">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span>Join community: <span className="font-semibold text-foreground">10 B Coins</span></span>
              </Badge>
              <Badge variant="outline" className="justify-start gap-2 py-1.5 text-muted-foreground bg-background/50 hover:bg-background transition-colors">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span>Create community: <span className="font-semibold text-foreground">20 B Coins</span></span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Earn B Coins - Free */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">B</span>
                </span>
                Earn B Coins for Free
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Daily engagement, watching ads, newsletter feedback, surveys</p>
            </div>
            <Button
              onClick={handleWatchAd}
              disabled={adViews >= maxAds || claimBCoins.isPending}
              className="gradient-primary border-0 hover:opacity-90"
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Ad ({maxAds - adViews} left)
            </Button>
          </CardHeader>
        </Card>
      </motion.div>

      {/* P Coins - Premium */}
      <div className="text-center">
        <Badge className="bg-destructive/20 text-destructive border-destructive/30 mb-3">Premium Currency</Badge>
        <h2 className="text-3xl font-bold">Buy P Coins</h2>
        <p className="text-muted-foreground mt-2">P Coins work for both A Coin and B Coin purposes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptionPlans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            whileHover={{ y: -5 }}
          >
            <Card
              className={`glass border-border/50 flex flex-col h-full relative ${plan.recommended ? "border-destructive shadow-lg" : ""
                }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-destructive text-destructive-foreground border-0 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Recommended
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                <p className="text-muted-foreground text-sm">{plan.coins}</p>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between text-center">
                <div>
                  <p className="text-muted-foreground text-sm">Starts at</p>
                  <p className="text-4xl font-bold my-2">₹{plan.price}</p>
                  <p className="text-muted-foreground text-sm">/ {plan.title.toLowerCase()}</p>
                  <ul className="text-left my-6 space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full bg-destructive text-destructive-foreground hover:opacity-90 font-bold">
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EarnCoinsPage;
