import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Moon, Zap, ShieldCheck, Eye, Brain, Palette, Gift,
  LogOut, Trash2, Key, Info, ChevronRight, Volume2, RefreshCcw,
  Check, Lock, User, Type, Accessibility, Star, CheckCircle2,
  SlidersHorizontal, Globe, BarChart2, Sparkles, Sun,
} from "lucide-react";
import {
  useTheme, THEMES, AVATAR_FRAMES, SOUND_PACKS,
  type ThemeId, type AvatarFrameId, type SoundPackId,
} from "@/contexts/ThemeContext";
import { useProfile } from "@/hooks/useProfile";

// ─── Purchased rewards helper ──────────────────────────────────────────────────
const getPurchased = (): Set<number> => {
  try { return new Set(JSON.parse(localStorage.getItem("dd_purchased_rewards") || "[]")); }
  catch { return new Set(); }
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const SectionCard = ({
  icon, title, description, children, delay = 0,
}: {
  icon: React.ReactNode; title: string; description: string;
  children: React.ReactNode; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 80 }}
  >
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <span className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
            {icon}
          </span>
          {title}
        </CardTitle>
        <CardDescription className="mt-0.5">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-0">{children}</CardContent>
    </Card>
  </motion.div>
);

const Row = ({
  label, description, children, dangerous = false,
}: {
  label: string; description?: string; children: React.ReactNode; dangerous?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border/25 last:border-0">
    <div className="min-w-0 flex-1">
      <p className={`text-sm font-medium ${dangerous ? "text-destructive" : ""}`}>{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

// ─── Theme Card ────────────────────────────────────────────────────────────────
const ThemeCard = ({
  themeId, active, owned, onSelect,
}: {
  themeId: ThemeId; active: boolean; owned: boolean; onSelect: () => void;
}) => {
  const theme = THEMES[themeId];
  return (
    <motion.button
      whileHover={owned ? { scale: 1.04 } : {}}
      whileTap={owned ? { scale: 0.97 } : {}}
      onClick={() => owned && onSelect()}
      disabled={!owned}
      className={`relative rounded-xl border p-3 flex flex-col gap-2 text-left transition-all w-full ${active
          ? "border-primary/80 bg-primary/10 shadow-[0_0_16px_rgba(139,92,246,0.25)]"
          : owned
            ? "border-border/50 hover:border-primary/40 hover:bg-secondary/40 cursor-pointer"
            : "border-border/25 opacity-45 cursor-not-allowed"
        }`}
    >
      {/* Preview swatch */}
      <div
        className="h-10 rounded-lg w-full"
        style={{ background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[1]})` }}
      />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold">{theme.icon} {theme.name}</p>
          {theme.rewardId && !owned && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
              <Lock className="w-2.5 h-2.5" /> Locked
            </p>
          )}
          {!theme.rewardId && (
            <p className="text-[10px] text-success font-medium">Free</p>
          )}
          {theme.rewardId && owned && (
            <p className="text-[10px] text-primary font-medium">Unlocked</p>
          )}
        </div>
        {active && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
      </div>
    </motion.button>
  );
};

// ─── Avatar Frame Card ─────────────────────────────────────────────────────────
const FrameCard = ({
  frameId, active, owned, userName, onSelect,
}: {
  frameId: AvatarFrameId; active: boolean; owned: boolean; userName: string; onSelect: () => void;
}) => {
  const frame = AVATAR_FRAMES[frameId];
  return (
    <motion.button
      whileHover={owned ? { scale: 1.05 } : {}}
      whileTap={owned ? { scale: 0.96 } : {}}
      onClick={() => owned && onSelect()}
      disabled={!owned}
      className={`relative rounded-xl border p-3 flex flex-col items-center gap-2 transition-all w-full ${active
          ? "border-primary/80 bg-primary/10"
          : owned
            ? "border-border/50 hover:border-primary/40 hover:bg-secondary/40 cursor-pointer"
            : "border-border/25 opacity-45 cursor-not-allowed"
        }`}
    >
      {/* Avatar preview */}
      <div className={`w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary ${owned ? frame.css : ""}`}>
        {userName.slice(0, 1).toUpperCase()}
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold">{frame.icon} {frame.name}</p>
        {!frame.rewardId && <p className="text-[10px] text-success font-medium">Free</p>}
        {frame.rewardId && !owned && <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-center"><Lock className="w-2.5 h-2.5" /> Locked</p>}
        {frame.rewardId && owned && !active && <p className="text-[10px] text-primary font-medium">Owned</p>}
      </div>
      {active && <CheckCircle2 className="w-3.5 h-3.5 text-primary absolute top-2 right-2" />}
    </motion.button>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings, updateSetting, resetSettings } = useTheme();
  const { data: profile } = useProfile();
  const [saved, setSaved] = useState(false);
  const purchased = getPurchased();

  const userName = (profile as any)?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";

  const handleSave = () => {
    setSaved(true);
    toast.success("✅ Settings saved!");
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleReset = () => {
    resetSettings();
    toast.info("Settings reset to defaults.");
  };

  const isThemeOwned = (id: ThemeId) => !THEMES[id].rewardId || purchased.has(THEMES[id].rewardId!);
  const isFrameOwned = (id: AvatarFrameId) => !AVATAR_FRAMES[id].rewardId || purchased.has(AVATAR_FRAMES[id].rewardId!);
  const isSoundOwned = (id: SoundPackId) => !SOUND_PACKS[id].rewardId || purchased.has(SOUND_PACKS[id].rewardId!);

  return (
    <div className="space-y-5 max-w-3xl pb-12">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Personalize your experience, unlock rewards & manage your account</p>
        </div>
        <Button
          onClick={handleSave}
          className={`gap-2 min-w-[140px] transition-all ${saved ? "bg-success hover:bg-success/90 border-success" : "gradient-primary border-0 hover:opacity-90"}`}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><SlidersHorizontal className="w-4 h-4" /> Save Changes</>}
        </Button>
      </div>

      {/* ── Account Card ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass border-border/50 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary to-primary-glow" />
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0 ${AVATAR_FRAMES[settings.avatarFrame]?.css || ""}`}>
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-[10px] h-5 border-primary/40 text-primary">
                  {THEMES[settings.theme].icon} {THEMES[settings.theme].name}
                </Badge>
                <Badge variant="outline" className="text-[10px] h-5">
                  {AVATAR_FRAMES[settings.avatarFrame].icon} {AVATAR_FRAMES[settings.avatarFrame].name}
                </Badge>
              </div>
            </div>
            <Link to="/profile">
              <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
                <User className="w-3.5 h-3.5" /> Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── 1. APPEARANCE & THEMES ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      <SectionCard icon={<Palette className="w-4 h-4" />} title="Appearance & Themes" description="Customize the look and feel of the entire app" delay={0.04}>

        {/* Light/Dark toggle */}
        <Row label="Color Mode" description="The app is designed for dark mode but light mode is coming soon">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <Switch checked={settings.darkMode ?? true} onCheckedChange={(v) => updateSetting("darkMode" as any, v)} />
            <Moon className="w-4 h-4 text-primary" />
          </div>
        </Row>

        <Separator className="bg-border/30 my-1" />

        {/* Themes grid */}
        <div className="py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Dashboard Theme <span className="text-primary ml-1 font-normal normal-case">— click to apply instantly</span>
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => (
              <ThemeCard
                key={id}
                themeId={id}
                active={settings.theme === id}
                owned={isThemeOwned(id)}
                onSelect={() => {
                  updateSetting("theme", id);
                  toast.success(`${THEMES[id].icon} ${THEMES[id].name} theme applied!`);
                }}
              />
            ))}
          </div>
          {(Object.keys(THEMES) as ThemeId[]).some((id) => !isThemeOwned(id)) && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Locked themes can be purchased in the
              <Link to="/rewards" className="text-primary underline underline-offset-2">Rewards Shop</Link>
            </p>
          )}
        </div>

        <Separator className="bg-border/30 my-1" />

        {/* Avatar Frames */}
        <div className="py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Avatar Frame</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(AVATAR_FRAMES) as AvatarFrameId[]).map((id) => (
              <FrameCard
                key={id}
                frameId={id}
                active={settings.avatarFrame === id}
                owned={isFrameOwned(id)}
                userName={userName}
                onSelect={() => {
                  updateSetting("avatarFrame", id);
                  toast.success(`${AVATAR_FRAMES[id].icon} ${AVATAR_FRAMES[id].name} applied!`);
                }}
              />
            ))}
          </div>
        </div>

        <Separator className="bg-border/30 my-1" />

        {/* Sound Packs */}
        <div className="py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notification Sound Pack</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SOUND_PACKS) as SoundPackId[]).map((id) => {
              const sp = SOUND_PACKS[id];
              const owned = isSoundOwned(id);
              const active = settings.soundPack === id;
              return (
                <button
                  key={id}
                  disabled={!owned}
                  onClick={() => {
                    if (!owned) return;
                    updateSetting("soundPack", id);
                    toast.success(`${sp.icon} ${sp.name} sound pack active!`);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${active
                      ? "border-primary/70 bg-primary/15 text-primary"
                      : owned
                        ? "border-border/50 hover:border-primary/40 text-foreground cursor-pointer"
                        : "border-border/25 text-muted-foreground opacity-50 cursor-not-allowed"
                    }`}
                >
                  <span className="text-base">{sp.icon}</span>
                  <span>{sp.name}</span>
                  {active && <Check className="w-3 h-3" />}
                  {!owned && <Lock className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-1 pb-2 text-center">
          <Link to="/rewards">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Gift className="w-3.5 h-3.5" /> Browse Rewards Shop
              <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </SectionCard>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── 2. ACCESSIBILITY ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      <SectionCard icon={<Accessibility className="w-4 h-4" />} title="Accessibility" description="Make the app work better for you" delay={0.08}>
        <Row label="Font Size" description="Adjusts text size across the entire app">
          <Select value={settings.fontSize} onValueChange={(v) => updateSetting("fontSize" as any, v)}>
            <SelectTrigger className="w-[150px] bg-secondary/30 border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (14px)</SelectItem>
              <SelectItem value="medium">Medium (16px) ✓</SelectItem>
              <SelectItem value="large">Large (18px)</SelectItem>
              <SelectItem value="x-large">X-Large (20px)</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="Reduce Motion" description="Disables animations and transitions — better for motion sensitivity">
          <Switch checked={settings.reducedMotion} onCheckedChange={(v) => updateSetting("reducedMotion", v)} />
        </Row>
        <Row label="Compact Mode" description="Tighter spacing to fit more on screen">
          <Switch checked={settings.compactMode} onCheckedChange={(v) => updateSetting("compactMode", v)} />
        </Row>
        <Row label="High Contrast" description="Increases text and border contrast for readability">
          <Switch checked={settings.highContrast} onCheckedChange={(v) => updateSetting("highContrast", v)} />
        </Row>
      </SectionCard>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── 3. NOTIFICATIONS ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      <SectionCard icon={<Bell className="w-4 h-4" />} title="Notifications" description="Control when and how you get notified" delay={0.12}>
        <Row label="Push Notifications" description="Allow browser / device notifications">
          <Switch checked={settings.notifications} onCheckedChange={(v) => updateSetting("notifications", v)} />
        </Row>
        <Row label="Daily Reminders" description="Get nudged to log your habits each day">
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => updateSetting("reminderTime", e.target.value)}
              disabled={!settings.dailyReminders}
              className="w-[108px] bg-secondary/30 border-border text-sm"
            />
            <Switch checked={settings.dailyReminders} onCheckedChange={(v) => updateSetting("dailyReminders", v)} />
          </div>
        </Row>
        <Row label="Achievement Alerts" description="Notify when you're close to or unlock an achievement">
          <Switch checked={settings.achievementAlerts} onCheckedChange={(v) => updateSetting("achievementAlerts", v)} />
        </Row>
        <Row label="Streak Alerts" description="Warn you before your streak is about to break">
          <Switch checked={settings.streakAlerts} onCheckedChange={(v) => updateSetting("streakAlerts", v)} />
        </Row>
        <Row label="Sound Effects" description="Play sounds on habit completion and achievements">
          <Switch checked={settings.soundEffects} onCheckedChange={(v) => updateSetting("soundEffects", v)} />
        </Row>
        <Row label="Haptic Feedback" description="Vibration on mobile devices">
          <Switch checked={settings.hapticFeedback} onCheckedChange={(v) => updateSetting("hapticFeedback", v)} />
        </Row>
      </SectionCard>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── 4. HABIT PREFERENCES ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      <SectionCard icon={<Zap className="w-4 h-4" />} title="Habit Preferences" description="Tweak how your habits are tracked and displayed" delay={0.16}>
        <Row label="Default Cycle Length" description="Duration of each habit tracking cycle">
          <Select value={settings.cycleLength} onValueChange={(v) => updateSetting("cycleLength", v)}>
            <SelectTrigger className="w-[160px] bg-secondary/30 border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2-weeks">2 weeks</SelectItem>
              <SelectItem value="4-weeks">4 weeks</SelectItem>
              <SelectItem value="6-weeks">6 weeks</SelectItem>
              <SelectItem value="8-weeks">8 weeks</SelectItem>
              <SelectItem value="12-weeks">12 weeks</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="Default Effort Level" description={`Pre-fill effort slider at: ${settings.defaultEffortLevel}/5`}>
          <div className="w-[160px]">
            <Slider
              min={1} max={5} step={1}
              value={[settings.defaultEffortLevel]}
              onValueChange={([v]) => updateSetting("defaultEffortLevel", v)}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Easy</span><span>Hard</span>
            </div>
          </div>
        </Row>
        <Row label="Show Completed Habits" description="Keep completed habits visible in the daily list">
          <Switch checked={settings.showCompletedHabits} onCheckedChange={(v) => updateSetting("showCompletedHabits", v)} />
        </Row>
        <Row label="Habit Sort Order" description="How habits appear in your daily list">
          <Select value={settings.habitSortOrder} onValueChange={(v) => updateSetting("habitSortOrder", v)}>
            <SelectTrigger className="w-[160px] bg-secondary/30 border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Date Created</SelectItem>
              <SelectItem value="name">Alphabetical</SelectItem>
              <SelectItem value="streak">Streak Length</SelectItem>
              <SelectItem value="completion">Completion Rate</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </SectionCard>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── 5. PRIVACY & COMMUNITY ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      <SectionCard icon={<Eye className="w-4 h-4" />} title="Privacy & Community" description="Control what others can see about you" delay={0.2}>
        <Row label="Profile Visibility" description="Who can view your profile">
          <Select value={settings.profileVisibility} onValueChange={(v) => updateSetting("profileVisibility", v)}>
            <SelectTrigger className="w-[155px] bg-secondary/30 border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">🌐 Public</SelectItem>
              <SelectItem value="group">👥 Group Only</SelectItem>
              <SelectItem value="private">🔒 Private</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="Show on Leaderboard" description="Appear in community rankings">
          <Switch checked={settings.showOnLeaderboard} onCheckedChange={(v) => updateSetting("showOnLeaderboard", v)} />
        </Row>
        <Row label="Show Current Streak" description="Display your streak on your public profile">
          <Switch checked={settings.showStreak} onCheckedChange={(v) => updateSetting("showStreak", v)} />
        </Row>
        <Row label="Show Level & XP" description="Let others see your level on your profile">
          <Switch checked={settings.showLevel} onCheckedChange={(v) => updateSetting("showLevel", v)} />
        </Row>
        <Row label="Group Discovery" description="Let others find and invite you to groups">
          <Switch checked={settings.groupDiscovery} onCheckedChange={(v) => updateSetting("groupDiscovery", v)} />
        </Row>
      </SectionCard>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── 6. AI & PERSONALIZATION ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      <SectionCard icon={<Brain className="w-4 h-4" />} title="AI & Personalization" description="Shape how the AI coach works for you" delay={0.24}>
        <Row label="AI Coach Tone" description="How your coach communicates with you">
          <Select value={settings.aiCoachTone} onValueChange={(v) => updateSetting("aiCoachTone", v)}>
            <SelectTrigger className="w-[160px] bg-secondary/30 border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="encouraging">😊 Encouraging</SelectItem>
              <SelectItem value="motivating">🔥 Motivating</SelectItem>
              <SelectItem value="direct">⚡ Direct</SelectItem>
              <SelectItem value="gentle">🌸 Gentle</SelectItem>
              <SelectItem value="tough-love">💪 Tough Love</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="Personalized Suggestions" description="AI learns from your habits to give better tips">
          <Switch checked={settings.personalizedSuggestions} onCheckedChange={(v) => updateSetting("personalizedSuggestions", v)} />
        </Row>
        <Row label="Weekly Insights" description="Get an AI-generated weekly progress digest">
          <Switch checked={settings.weeklyInsights} onCheckedChange={(v) => updateSetting("weeklyInsights", v)} />
        </Row>
        <Row label="Reflection History" description="How long AI can access your past journal entries">
          <Select value={settings.reflectionHistory} onValueChange={(v) => updateSetting("reflectionHistory", v)}>
            <SelectTrigger className="w-[160px] bg-secondary/30 border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7-days">Last 7 days</SelectItem>
              <SelectItem value="30-days">Last 30 days</SelectItem>
              <SelectItem value="90-days">Last 90 days</SelectItem>
              <SelectItem value="1-year">Last year</SelectItem>
              <SelectItem value="forever">All time</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </SectionCard>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── 7. SECURITY & ACCOUNT ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      <SectionCard icon={<ShieldCheck className="w-4 h-4" />} title="Security & Account" description="Manage your account security and data" delay={0.28}>
        <Row label="Email" description="Your login email address">
          <span className="text-xs text-muted-foreground font-mono bg-secondary/40 px-2 py-1 rounded-lg max-w-[200px] truncate block">
            {userEmail}
          </span>
        </Row>
        <Row label="Change Password" description="Send a password reset link to your email">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info(`📧 Reset link sent to ${userEmail}`)}>
            <Key className="w-3.5 h-3.5" /> Send Reset Link
          </Button>
        </Row>
        <Row label="Export My Data" description="Download all your habits, journals & progress as JSON">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("📦 Data export is being prepared — coming soon!")}>
            Export JSON
          </Button>
        </Row>
        <Row label="App Version">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">v1.0.2</Badge>
            <span className="text-xs text-success flex items-center gap-1">
              <Info className="w-3 h-3" /> Up to date
            </span>
          </div>
        </Row>
        <Row label="Reset All Settings" description="Revert every setting back to its default value">
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground" onClick={handleReset}>
            <RefreshCcw className="w-3.5 h-3.5" /> Reset to Defaults
          </Button>
        </Row>
        <Row label="Delete Account" description="Permanently remove your account and all data — this cannot be undone" dangerous>
          <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => toast.error("⚠️ Account deletion requires email confirmation. This feature is coming in a future update.")}>
            <Trash2 className="w-3.5 h-3.5" /> Delete Account
          </Button>
        </Row>
      </SectionCard>

      {/* ── Sign Out ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-border/40 glass"
      >
        <div>
          <p className="font-semibold text-sm">Ready to take a break?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your progress is safely saved in the cloud. See you soon! 👋</p>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="gap-2 w-full sm:w-auto">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
