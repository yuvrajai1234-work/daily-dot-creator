import { useState, useEffect, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Play, Crown, Zap, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useAddXP } from "@/hooks/useXP";
import { Progress } from "@/components/ui/progress";
import { differenceInDays, endOfWeek } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { getAppDate, getCycleStartDate } from "@/lib/dateUtils";
import { useRewardedAd } from "@/hooks/useRewardedAd";
import { useSearchParams } from "react-router-dom";

// Stripe price IDs mapped to each plan
const subscriptionPlans = [
  {
    title: "Weekly",
    price: "399",
    coins: "100 P Coins",
    priceId: "price_1T8fRY3WWGDm9b3SU9X2iL9b",
    features: ["100 P Coins", "Ad-Free Experience", "Exclusive Badge"],
  },
  {
    title: "Monthly",
    price: "1199",
    coins: "500 P Coins",
    priceId: "price_1T8fRx3WWGDm9b3SMOyeXEzd",
    recommended: true,
    features: ["500 P Coins", "Ad-Free Experience", "Exclusive Badge", "Premium Content Access"],
  },
  {
    title: "6 Months",
    price: "6399",
    coins: "3000 P Coins",
    priceId: "price_1T8fUl3WWGDm9b3SbovWfS5J",
    features: ["3000 P Coins", "Everything in Monthly", "Bonus Event Coins"],
  },
  {
    title: "Yearly",
    price: "11999",
    coins: "7000 P Coins",
    priceId: "price_1T8fVR3WWGDm9b3SjUzJbidC",
    features: ["7000 P Coins", "Everything in 6 Months", "Early Access to Features"],
  },
];

// XP is rewarded for the first 5 ad watches per day only
const MAX_XP_ADS = 5;

const getTodayAdKey = () => `ad_views_${getAppDate()}`;
const getTodayAdCount = () => parseInt(localStorage.getItem(getTodayAdKey()) || "0", 10);
const incrementTodayAdCount = () => {
  const key = getTodayAdKey();
  const next = getTodayAdCount() + 1;
  localStorage.setItem(key, String(next));
  return next;
};

const NativeAdContainer = memo(() => {
  const adHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; background: transparent; overflow-x: hidden; font-family: sans-serif; }
          #container-69dc1314fa49a484cbdcbd9ef807af5b { width: 100% !important; text-align: center; }
          .ad-loading { color: #888; font-size: 12px; margin-top: 50px; text-align: center; }
        </style>
      </head>
      <body>
        <div id="container-69dc1314fa49a484cbdcbd9ef807af5b">
          <div class="ad-loading">Re-initializing ad stream...</div>
        </div>
        <script async="async" data-cfasync="false" src="https://pl28994651.profitablecpmratenetwork.com/69dc1314fa49a484cbdcbd9ef807af5b/invoke.js"></script>
      </body>
    </html>
  `, []);

  return (
    <div className="w-full flex items-center justify-center min-h-[300px]">
      <iframe
        srcDoc={adHtml}
        className="w-full border-0 min-h-[350px] overflow-y-auto"
        sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
        title="Ad Container"
      />
    </div>
  );
});

const EarnCoinsPage = () => {
  const [adViews, setAdViews] = useState(() => getTodayAdCount());
  const [isWatching, setIsWatching] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    price_id?: string;
    subscription_end?: string;
  }>({ subscribed: false });
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const addXP = useAddXP();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Check for checkout result from URL
  useEffect(() => {
    const checkoutResult = searchParams.get("checkout");
    if (checkoutResult === "success") {
      // Give Stripe a couple seconds to fully process before checking
      toast.success("🎉 Payment successful! Checking your subscription...");
      setTimeout(() => {
        checkSubscription();
      }, 2000);
    } else if (checkoutResult === "cancel") {
      toast.info("Checkout was cancelled.");
    }
  }, [searchParams]);

  // Check subscription status on mount
  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscriptionStatus(data);
      if (data?.coins_credited && data?.coins_amount > 0) {
        toast.success(`🎉 +${data.coins_amount} P Coins credited for your subscription!`);
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (err) {
      console.warn("Failed to check subscription:", err);
    }
  };

  useEffect(() => {
    if (user) checkSubscription();
  }, [user]);

  const handleBuyPlan = async (priceId: string) => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    setLoadingPlan(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        // Redirect in the same tab so ?checkout=success is detected on return
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to open subscription management");
    }
  };

  const handleClaimReward = async () => {
    if (!user) return;

    const newCount = incrementTodayAdCount();
    setAdViews(newCount);
    const givesXP = newCount <= MAX_XP_ADS;

    try {
      const { data: newBalance, error: rpcError } = await (supabase as any).rpc("add_b_coins", {
        p_user_id: user.id,
        p_amount: 10,
      });

      if (rpcError) throw rpcError;
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      if (givesXP) {
        addXP.mutate({ amount: 10, activityType: "watch_ad", description: "Watched an ad" });
        const remaining = MAX_XP_ADS - newCount;
        toast.success(
          `🎬 +10 B Coins  ⚡ +10 XP${remaining > 0 ? `  (${remaining} XP reward${remaining !== 1 ? "s" : ""} left today)` : "  (daily XP limit reached!)"}`
        );
      } else {
        toast.success("🎬 +10 B Coins  (XP limit reached for today — keep watching for coins!)");
      }
    } catch {
      toast.error("Failed to claim ad reward");
    } finally {
      setIsWatching(false);
    }
  };

  // Removed GAM-based rewarded ad hook as we use specific ad network now

  const bCoins = (profile as any)?.b_coin_balance || 0;

  // Calculate days until current cycle week resets
  let daysUntilReset = 0;
  if ((profile as any)?.created_at) {
    const cycleStart = getCycleStartDate((profile as any).created_at);
    const todayStr = getAppDate();
    const today = new Date(todayStr + "T00:00:00");
    const diffDays = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeekIndex = Math.min(Math.floor(Math.max(0, diffDays) / 7), 3);
    const dayInWeek = diffDays - currentWeekIndex * 7;
    // Week is 7 days long (0 to 6)
    daysUntilReset = Math.max(0, 6 - dayInWeek);
  }

  const xpLimitReached = adViews >= MAX_XP_ADS;
  const xpAdsLeft = Math.max(0, MAX_XP_ADS - adViews);

  const handleWatchAd = () => {
    if (!user || isWatching) return;

    setIsWatching(true);
    setAdTimer(10); // 10 second countdown

    const interval = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleClaimReward();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
                  Resets in {daysUntilReset} days (End of Week)
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{bCoins}</p>
                <p className="text-xs text-muted-foreground">this week</p>
              </div>
            </div>
            <Progress value={Math.min((bCoins % 100), 100)} className="h-3" />
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                Ways to Earn
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Watch an ad", amount: "+10 B Coins" },
                  { label: "Daily quest reward", amount: "+varies" },
                  { label: "Streak milestone reward", amount: "+varies" },
                  { label: "Claim quest (via Earn Coins page)", amount: "+varies" },
                ].map(({ label, amount }) => (
                  <Badge key={label} variant="outline" className="justify-start gap-2 py-1.5 text-muted-foreground bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span>{label}: <span className="font-semibold text-emerald-500">{amount}</span></span>
                  </Badge>
                ))}
              </div>

              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1.5 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                Ways Coins Are Spent
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Log a habit", amount: "−15 B Coins" },
                  { label: "Create a new habit", amount: "−50 B Coins" },
                  { label: "Save a journal entry", amount: "−10 B Coins" },
                  { label: "Create a community", amount: "−200 B Coins" },
                  { label: "Join a community", amount: "−100 B Coins" },
                  { label: "Archive habit", amount: "−50 B Coins" },
                  { label: "Add reminder", amount: "−5 B Coins" },
                ].map(({ label, amount }) => (
                  <Badge key={label} variant="outline" className="justify-start gap-2 py-1.5 text-muted-foreground bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    <span>{label}: <span className="font-semibold text-rose-400">{amount}</span></span>
                  </Badge>
                ))}
              </div>
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
            <div className="flex flex-col items-end gap-1.5">
              <Button
                onClick={handleWatchAd}
                disabled={isWatching}
                className="gradient-primary border-0 hover:opacity-90 min-w-[140px]"
              >
                {isWatching ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <Zap className="w-4 h-4 text-yellow-400" />
                    </motion.span>
                    Opening...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Watch Ad
                  </>
                )}
              </Button>
              <div className="text-xs flex items-center gap-1">
                {xpLimitReached ? (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    XP limit reached for today
                  </span>
                ) : (
                  <span className="text-green-500 flex items-center gap-1 font-medium">
                    <Zap className="w-3 h-3" />
                    {xpAdsLeft} XP reward{xpAdsLeft !== 1 ? "s" : ""} left today
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* P Coins - Premium */}
      <div className="text-center">
        <Badge className="bg-destructive/20 text-destructive border-destructive/30 mb-3">Premium Currency</Badge>
        <h2 className="text-3xl font-bold">Buy P Coins</h2>
        <p className="text-muted-foreground mt-2">P Coins work for both A Coin and B Coin purposes</p>
        {subscriptionStatus.subscribed && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
              ✅ Active Subscriber
            </Badge>
            <Button variant="outline" size="sm" onClick={handleManageSubscription} className="gap-1">
              <Settings className="w-3 h-3" />
              Manage
            </Button>
          </div>
        )}
      </div>

      {/* Success Banner after payment - manual claim fallback */}
      {searchParams.get("checkout") === "success" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-emerald-400">Payment successful!</p>
              <p className="text-xs text-muted-foreground">Your P Coins should appear in your balance. If not, click Claim.</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={checkSubscription}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shrink-0"
          >
            Claim My Coins
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {subscriptionPlans.map((plan, index) => {
          const isCurrentPlan = subscriptionStatus.subscribed && subscriptionStatus.price_id === plan.priceId;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              whileHover={{ y: -5 }}
            >
              <Card
                className={`glass border-border/50 flex flex-col h-full relative ${plan.recommended ? "border-destructive shadow-lg" : ""} ${isCurrentPlan ? "border-emerald-500 shadow-emerald-500/20 shadow-lg" : ""}`}
              >
                {plan.recommended && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-destructive text-destructive-foreground border-0 flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Recommended
                    </Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white border-0 flex items-center gap-1">
                      ✅ Your Plan
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
                  <Button
                    onClick={() => handleBuyPlan(plan.priceId)}
                    disabled={loadingPlan === plan.priceId || isCurrentPlan}
                    className={`w-full font-bold ${isCurrentPlan ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30" : "bg-destructive text-destructive-foreground hover:opacity-90"}`}
                  >
                    {loadingPlan === plan.priceId ? "Redirecting..." : isCurrentPlan ? "Current Plan" : "Buy Now"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Ad Overlay for Native Banner */}
      {isWatching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-lg glass border-primary/30 p-8 text-center relative pointer-events-auto">
            <h3 className="text-xl font-bold mb-4">Ad in Progress...</h3>
            <p className="text-muted-foreground mb-6">
              Reward granted in <span className="text-primary font-bold text-lg">{adTimer}s</span>
            </p>
            
            <div className="bg-white/5 rounded-xl p-4 overflow-hidden border border-border/50 min-h-[300px] flex items-center justify-center">
              {/* Native Banner Container */}
              <NativeAdContainer />
            </div>
            <p className="text-[10px] uppercase text-muted-foreground/50 mt-4 tracking-tighter italic">Keep this screen open to earn your B Coins</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EarnCoinsPage;
