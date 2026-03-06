import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Gift, ShoppingBag, Lock, CheckCircle, Star, Zap, Crown,
  Shield, Palette, Bell, BookOpen, Sparkles, Trophy, X, Unlock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { useSpendACoins } from "@/hooks/useCoins";
import { toast } from "sonner";

// ─── Reward catalogue ─────────────────────────────────────────────────────────
// "purchased" tracking is managed via localStorage so it persists per browser.
// For a production app this should be a DB table — swap the helpers below.
const PURCHASED_KEY = "dd_purchased_rewards";
const getPurchased = (): Set<number> =>
  new Set(JSON.parse(localStorage.getItem(PURCHASED_KEY) || "[]"));
const savePurchased = (ids: Set<number>) =>
  localStorage.setItem(PURCHASED_KEY, JSON.stringify([...ids]));

type Rarity = "common" | "rare" | "epic" | "legendary";

interface Reward {
  id: number;
  name: string;
  description: string;
  cost: number;
  icon: string;
  category: string;
  rarity: Rarity;
  highlight?: string; // short benefit label
}

const REWARDS: Reward[] = [
  // ── Customization ──
  { id: 1, name: "Pastel Theme", description: "Soft pastel color scheme for your dashboard.", cost: 50, icon: "🎨", category: "Customization", rarity: "common", highlight: "Dashboard skin" },
  { id: 2, name: "Neon Glow Theme", description: "Electrifying neon glow across the entire app.", cost: 150, icon: "💡", category: "Customization", rarity: "rare", highlight: "Dashboard skin" },
  { id: 3, name: "Dark Galaxy Theme", description: "Immersive deep-space gradient throughout the app.", cost: 300, icon: "🌌", category: "Customization", rarity: "epic", highlight: "Dashboard skin" },
  { id: 4, name: "Custom Accent Color", description: "Pick any hex color as your primary accent.", cost: 200, icon: "🖌️", category: "Customization", rarity: "rare", highlight: "UI accent" },

  // ── Badges ──
  { id: 5, name: "Early Adopter", description: "Show you were here from the start.", cost: 100, icon: "🥇", category: "Badges", rarity: "rare", highlight: "Profile badge" },
  { id: 6, name: "Streak Legend", description: "A fiery badge for streak fanatics.", cost: 250, icon: "🔥", category: "Badges", rarity: "epic", highlight: "Profile badge" },
  { id: 7, name: "Golden Crown", description: "Exclusive golden crown badge — extremely rare.", cost: 750, icon: "👑", category: "Badges", rarity: "legendary", highlight: "Profile badge" },
  { id: 8, name: "Diamond Shield", description: "A prestigious shield badge of honor.", cost: 500, icon: "💠", category: "Badges", rarity: "epic", highlight: "Profile badge" },

  // ── Power-ups ──
  { id: 9, name: "Streak Shield", description: "Saves your streak for one missed day. Use wisely!", cost: 200, icon: "🛡️", category: "Power-ups", rarity: "rare", highlight: "1-day streak guard" },
  { id: 10, name: "Double XP Boost", description: "Earn 2× XP for the next 24 hours.", cost: 300, icon: "⚡", category: "Power-ups", rarity: "epic", highlight: "24hr ×2 XP" },
  { id: 11, name: "Habit Boost", description: "Habit completions award +5 B Coins for 48 hours.", cost: 250, icon: "🚀", category: "Power-ups", rarity: "rare", highlight: "48hr +5 B Coins" },
  { id: 12, name: "B-Coin Boost", description: "Instantly gain 50 bonus B Coins right now.", cost: 175, icon: "🪙", category: "Power-ups", rarity: "common", highlight: "+50 B Coins" },

  // ── Avatar & Profile ──
  { id: 13, name: "Golden Avatar Frame", "description": "Glowing golden ring around your avatar everywhere.", cost: 150, icon: "🖼️", category: "Avatar", rarity: "rare", highlight: "Avatar frame" },
  { id: 14, name: "Animated Avatar", description: "Add a shimmer animation to your profile picture.", cost: 350, icon: "✨", category: "Avatar", rarity: "epic", highlight: "Avatar effect" },
  { id: 15, name: "Rainbow Frame", description: "Hypnotic rainbow border — turns heads in community.", cost: 600, icon: "🌈", category: "Avatar", rarity: "legendary", highlight: "Avatar frame" },

  // ── Content ──
  { id: 16, name: "Premium E-Book", description: "Unlock a hand-picked self-growth e-book.", cost: 250, icon: "📚", category: "Content", rarity: "rare", highlight: "E-book access" },
  { id: 17, name: "Guided Meditation", description: "5-day guided audio meditation series.", cost: 200, icon: "🧘", category: "Content", rarity: "rare", highlight: "Audio series" },
  { id: 18, name: "Habit Blueprint", description: "Expert-curated 30-day habit-building plan PDF.", cost: 400, icon: "🗺️", category: "Content", rarity: "epic", highlight: "PDF blueprint" },

  // ── Sounds ──
  { id: 19, name: "Zen Notifications", description: "Calming zen bell sounds for all notifications.", cost: 75, icon: "🔔", category: "Sounds", rarity: "common", highlight: "Sound pack" },
  { id: 20, name: "Retro 8-Bit Sounds", description: "Nostalgic pixel-game sounds — total flashback.", cost: 125, icon: "🎮", category: "Sounds", rarity: "common", highlight: "Sound pack" },
  { id: 21, name: "Epic Orchestra Pack", "description": "Cinematic orchestral fanfare for every achievement.", cost: 200, icon: "🎻", category: "Sounds", rarity: "rare", highlight: "Sound pack" },

  // ── Premium ──
  { id: 22, name: "Coach Session", description: "15-minute 1-on-1 with a certified habit coach.", cost: 1000, icon: "🎓", category: "Premium", rarity: "legendary", highlight: "Live session" },
  { id: 23, name: "Community VIP", description: "VIP status in all communities — pin posts, mod tools.", cost: 800, icon: "⭐", category: "Premium", rarity: "legendary", highlight: "Community VIP" },
  { id: 24, name: "Lifetime Dark Mode", description: "System-dark mode locked permanently with a badge.", cost: 500, icon: "🌙", category: "Premium", rarity: "epic", highlight: "Permanent perk" },
];

// ─── Rarity styling ────────────────────────────────────────────────────────────
const RARITY: Record<Rarity, { label: string; gradient: string; border: string; glow: string; color: string; badge: string }> = {
  common: { label: "Common", gradient: "from-slate-600 to-slate-700", border: "border-slate-500/40", glow: "", color: "text-slate-600 dark:text-slate-300", badge: "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30" },
  rare: { label: "Rare", gradient: "from-blue-600 to-blue-800", border: "border-blue-500/50", glow: "shadow-[0_0_16px_rgba(59,130,246,0.35)]", color: "text-blue-600 dark:text-blue-400", badge: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  epic: { label: "Epic", gradient: "from-purple-600 to-purple-900", border: "border-purple-500/60", glow: "shadow-[0_0_22px_rgba(168,85,247,0.4)]", color: "text-purple-600 dark:text-purple-400", badge: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  legendary: { label: "Legendary", gradient: "from-amber-500 to-amber-800", border: "border-amber-500/70", glow: "shadow-[0_0_30px_rgba(251,191,36,0.5)]", color: "text-amber-600 dark:text-amber-400", badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30" },
};

const CATEGORIES = ["All", "Customization", "Badges", "Power-ups", "Avatar", "Sounds", "Content", "Premium"];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Gift className="w-3.5 h-3.5" />,
  Customization: <Palette className="w-3.5 h-3.5" />,
  Badges: <Shield className="w-3.5 h-3.5" />,
  "Power-ups": <Zap className="w-3.5 h-3.5" />,
  Avatar: <Star className="w-3.5 h-3.5" />,
  Sounds: <Bell className="w-3.5 h-3.5" />,
  Content: <BookOpen className="w-3.5 h-3.5" />,
  Premium: <Crown className="w-3.5 h-3.5" />,
};

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
const ConfirmDialog = ({
  reward,
  aCoins,
  onConfirm,
  onCancel,
  isPending,
}: {
  reward: Reward;
  aCoins: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) => {
  const rc = RARITY[reward.rarity];
  const canAfford = aCoins >= reward.cost;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Dialog */}
      <motion.div
        className={`relative z-10 w-full max-w-sm rounded-2xl border ${rc.border} bg-[hsl(var(--card))] p-6 shadow-2xl ${rc.glow}`}
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <button onClick={onCancel} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>

        <div className={`h-1 -mx-6 -mt-6 mb-5 rounded-t-2xl bg-gradient-to-r ${rc.gradient}`} />

        <div className="text-center space-y-3">
          <span className="text-5xl">{reward.icon}</span>
          <h2 className="text-xl font-bold">{reward.name}</h2>
          <p className="text-sm text-muted-foreground">{reward.description}</p>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${rc.badge}`}>
            <Sparkles className="w-3 h-3" />
            {rc.label}
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-secondary/40 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Cost</p>
            <p className={`text-2xl font-bold ${canAfford ? "text-amber-400" : "text-destructive"}`}>
              {reward.cost} <span className="text-sm font-normal text-muted-foreground">A Coins</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Your Balance</p>
            <p className={`text-xl font-bold ${canAfford ? "text-foreground" : "text-destructive"}`}>
              {aCoins}
            </p>
          </div>
        </div>

        {!canAfford && (
          <p className="mt-3 text-center text-xs text-destructive">
            You need {reward.cost - aCoins} more A Coins. Earn them by completing achievements!
          </p>
        )}

        <div className="mt-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className={`flex-1 bg-gradient-to-r ${rc.gradient} text-white border-0 hover:opacity-90`}
            disabled={!canAfford || isPending}
            onClick={onConfirm}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Redeeming…
              </span>
            ) : (
              <><ShoppingBag className="w-4 h-4 mr-1.5" /> Confirm</>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Reward Card ───────────────────────────────────────────────────────────────
const RewardCard = ({
  reward,
  aCoins,
  purchased,
  onRedeem,
  index,
}: {
  reward: Reward;
  aCoins: number;
  purchased: boolean;
  onRedeem: () => void;
  index: number;
}) => {
  const rc = RARITY[reward.rarity];
  const canAfford = aCoins >= reward.cost;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5), type: "spring", stiffness: 100 }}
      whileHover={purchased ? {} : { y: -5, scale: 1.02 }}
      className="h-full relative group"
    >
      <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-br ${rc.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`} />
      <Card className={`glass flex flex-col h-full overflow-hidden transition-all duration-300 ${rc.border} ${purchased ? "opacity-75" : "hover:shadow-glow hover:shadow-primary/20"} ${!purchased && canAfford ? rc.glow : ""}`}>
        {/* Rarity accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${rc.gradient}`} />

        <CardContent className="flex flex-col flex-1 p-4 gap-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className={`text-3xl ${purchased ? "grayscale" : ""}`}>{reward.icon}</span>
              <div>
                <h3 className="font-semibold text-sm leading-tight">{reward.name}</h3>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${rc.badge}`}>
                  {rc.label}
                </span>
              </div>
            </div>
            {purchased && <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">{reward.description}</p>

          {/* Highlight badge */}
          <Badge variant="outline" className="w-fit text-[10px] bg-secondary/40">
            {reward.highlight}
          </Badge>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border/30">
            <span className={`text-sm font-bold ${canAfford && !purchased ? "text-amber-400" : "text-muted-foreground"}`}>
              {reward.cost} A Coins
            </span>

            {purchased ? (
              <span className="text-xs text-success font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Owned
              </span>
            ) : (
              <Button
                size="sm"
                className={`h-7 text-xs gap-1 ${canAfford
                  ? `bg-gradient-to-r ${rc.gradient} text-white border-0 hover:opacity-90`
                  : "border-border/50 text-muted-foreground"
                  }`}
                variant={canAfford ? "default" : "outline"}
                onClick={onRedeem}
                disabled={!canAfford}
              >
                {canAfford ? (
                  <><ShoppingBag className="w-3 h-3" /> Redeem</>
                ) : (
                  <><Lock className="w-3 h-3" /> {reward.cost - aCoins} more</>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const RewardsPage = () => {
  const { data: profile } = useProfile();
  const spendACoins = useSpendACoins();

  const [category, setCategory] = useState("All");
  const [rarityFilter, setRarityFilter] = useState<Rarity | "all">("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null);
  const [purchased, setPurchased] = useState<Set<number>>(() => getPurchased());

  const aCoins: number = (profile as any)?.a_coin_balance || 0;
  const pCoins: number = (profile as any)?.p_coin_balance || 0;

  const totalSpent = useMemo(
    () => REWARDS.filter((r) => purchased.has(r.id)).reduce((s, r) => s + r.cost, 0),
    [purchased]
  );

  const filtered = useMemo(() => {
    let list = category === "All" ? REWARDS : REWARDS.filter((r) => r.category === category);
    if (rarityFilter !== "all") list = list.filter((r) => r.rarity === rarityFilter);

    if (availabilityFilter === "unlocked") {
      list = list.filter((r) => purchased.has(r.id));
    } else if (availabilityFilter === "locked") {
      list = list.filter((r) => !purchased.has(r.id));
    }

    // Sort: affordable → locked → owned
    return [...list].sort((a, b) => {
      const aOwned = purchased.has(a.id), bOwned = purchased.has(b.id);
      if (aOwned && !bOwned) return 1;
      if (!aOwned && bOwned) return -1;
      const aAfford = aCoins >= a.cost, bAfford = aCoins >= b.cost;
      if (aAfford && !bAfford) return -1;
      if (!aAfford && bAfford) return 1;
      return a.cost - b.cost;
    });
  }, [category, rarityFilter, availabilityFilter, purchased, aCoins]);

  const handleConfirm = () => {
    if (!confirmReward) return;
    spendACoins.mutate(
      { amount: confirmReward.cost },
      {
        onSuccess: () => {
          const newSet = new Set(purchased);
          newSet.add(confirmReward.id);
          setPurchased(newSet);
          savePurchased(newSet);
          toast.success(`🎉 "${confirmReward.name}" redeemed! Enjoy your reward.`);
          setConfirmReward(null);
        },
        onError: () => {
          toast.error("Failed to redeem reward. Try again.");
          setConfirmReward(null);
        },
      }
    );
  };

  return (
    <>
      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmReward && (
          <ConfirmDialog
            reward={confirmReward}
            aCoins={aCoins}
            onConfirm={handleConfirm}
            onCancel={() => setConfirmReward(null)}
            isPending={spendACoins.isPending}
          />
        )}
      </AnimatePresence>

      <div className="space-y-6 pb-8">
        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Gift className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl font-bold">Rewards Shop</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Spend your hard-earned A Coins on themes, badges, power-ups & more.
            </p>
          </div>
        </div>

        {/* ── Balance Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* A Coins */}
          <Card className="gradient-hero border-0 shadow-primary-glow col-span-1 sm:col-span-1">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="text-2xl font-bold">A</span>
              </div>
              <div>
                <p className="text-xs opacity-70">A Coins (Achievement)</p>
                <p className="text-3xl font-bold">{aCoins}</p>
              </div>
            </CardContent>
          </Card>

          {/* P Coins */}
          <Card className="bg-gradient-to-br from-rose-500/20 to-rose-900/20 border-rose-500/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">P Coins (Premium)</p>
                <p className="text-3xl font-bold">{pCoins}</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Spent */}
          <Card className="glass border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Items Owned / Spent</p>
                <p className="text-3xl font-bold">{purchased.size} <span className="text-sm font-normal text-muted-foreground">/ {totalSpent} A</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Filters ── */}
        <div className="space-y-4 bg-secondary/20 p-4 rounded-2xl border border-border/50">
          {/* Availability pills */}
          <div className="flex items-center gap-2 flex-wrap pb-1">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mr-2">Quick Filter:</span>
            {[
              { id: "all", label: "All Rewards", icon: <Gift className="w-3.5 h-3.5" />, activeClass: "bg-primary text-primary-foreground" },
              { id: "unlocked", label: "Unlocked", icon: <Unlock className="w-3.5 h-3.5" />, activeClass: "bg-emerald-500/20 text-emerald-500 border-emerald-500/40" },
              { id: "locked", label: "Locked", icon: <Lock className="w-3.5 h-3.5" />, activeClass: "bg-amber-500/20 text-amber-500 border-amber-500/40" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setAvailabilityFilter(f.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${availabilityFilter === f.id
                  ? `${f.activeClass} shadow-glow shadow-primary/10`
                  : "border-border/40 text-muted-foreground hover:border-border/80 hover:bg-secondary/30"
                  }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>

          <Separator className="bg-border/30" />

          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mr-2">Category:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === cat
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
              >
                {CATEGORY_ICONS[cat]}
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mr-2">Rarity:</span>
            {(["all", "common", "rare", "epic", "legendary"] as const).map((r) => {
              const rc = r !== "all" ? RARITY[r] : null;
              return (
                <button
                  key={r}
                  onClick={() => setRarityFilter(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${rarityFilter === r
                    ? rc
                      ? `bg-gradient-to-r ${rc.gradient} border-transparent text-white`
                      : "bg-primary text-primary-foreground border-transparent"
                    : "border-border/50 text-muted-foreground hover:border-border"
                    }`}
                >
                  {r !== "all" && rc ? <span className={rc.color}>{rc.label}</span> : "All Rarities"}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Rewards Grid ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={category + rarityFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((reward, i) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                aCoins={aCoins}
                purchased={purchased.has(reward.id)}
                index={i}
                onRedeem={() => setConfirmReward(reward)}
              />
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No rewards in this category.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

export default RewardsPage;
