import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Check, Play, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

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

  const handleWatchAd = () => {
    if (adViews >= maxAds) {
      toast.error("Daily ad limit reached. Come back tomorrow!");
      return;
    }
    setAdViews(adViews + 1);
    toast.success("🪙 You earned 10 coins!");
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <Badge className="gradient-primary text-foreground border-0 mb-3">How Much Does It Cost?</Badge>
        <h1 className="text-4xl font-bold">Our Subscriptions</h1>
        <p className="text-muted-foreground mt-2">Choose a plan that works for you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptionPlans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <Card
              className={`glass border-border/50 flex flex-col h-full relative ${
                plan.recommended ? "border-primary shadow-primary-glow" : ""
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gradient-primary text-foreground border-0 flex items-center gap-1">
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
                <Button className="w-full bg-warning text-warning-foreground hover:opacity-90 font-bold">
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Free coins section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-warning" />
                Earn Coins for Free
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Watch ads to earn coins — an alternative to subscriptions.</p>
            </div>
            <Button
              onClick={handleWatchAd}
              disabled={adViews >= maxAds}
              className="gradient-primary border-0 hover:opacity-90"
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Ad ({maxAds - adViews} left)
            </Button>
          </CardHeader>
        </Card>
      </motion.div>
    </div>
  );
};

export default EarnCoinsPage;
