import { useState, useCallback } from "react";
import { requestNotificationPermission, getNotificationPermission, sendDeviceNotification } from "@/lib/deviceNotifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Moon, Zap, ShieldCheck, Palette, Gift,
  LogOut, Trash2, Key, Info, ChevronRight, Volume2, RefreshCcw,
  Check, Lock, User, Type, Accessibility, Star, CheckCircle2,
  SlidersHorizontal, Globe, BarChart2, Sparkles, Sun,
} from "lucide-react";
import {
  useTheme, THEMES, AVATAR_FRAMES, SOUND_PACKS,
  type ThemeId, type AvatarFrameId, type SoundPackId,
} from "@/contexts/ThemeContext";
import { useProfile } from "@/hooks/useProfile";
import AvatarWithFrame from "@/components/AvatarWithFrame";
import { supabase } from "@/integrations/supabase/client";

// ─── Purchased rewards tracking is now managed via the database ────────────────

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
  frameId, active, owned, userName, avatarUrl, onSelect,
}: {
  frameId: AvatarFrameId; active: boolean; owned: boolean; userName: string; avatarUrl: string; onSelect: () => void;
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
      <AvatarWithFrame
        avatarUrl={avatarUrl}
        fallback={userName.slice(0, 1).toUpperCase()}
        frameId={frameId}
        size="md"
      />
      <div className="text-center mt-2">
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
  const [resetConfirm, setResetConfirm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const purchasedArray: number[] = (profile as any)?.unlocked_rewards || [];
  const purchased = new Set(purchasedArray);

  const userName = (profile as any)?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  const avatarUrl = (profile as any)?.avatar_url || user?.user_metadata?.avatar_url || "";

  const handleSave = () => {
    setSaved(true);
    toast.success("✅ Settings saved!");
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleResetPassword = async () => {
    if (!userEmail) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      });
      if (error) throw error;
      toast.success(`📧 Reset link sent to ${userEmail}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    }
  };

  const handleReset = async () => {
    resetSettings();
    setResetConfirm("");

    if (user) {
      try {
        // 1. Reset Profile table fields
        const profileDefaults = {
          profile_visibility: 'public',
          show_on_leaderboard: true,
          group_discovery: true,
          show_streak: true,
          show_level: true,
          personality_traits: [],
          personality_type: 'ENTJ', // 50/50 result
          life_balance: {
            Career: 0,
            Strength: 0,
            Relationships: 0,
            Spirituality: 0,
            Learning: 0,
            Nutrition: 0,
          }
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileDefaults as any)
          .eq('user_id', user.id);

        if (profileError) throw profileError;

        // 2. Reset Auth Metadata
        const metadataDefaults = {
          introvertExtrovert: 50,
          analyticalCreative: 50,
          loyalFickle: 50,
          passiveActive: 50,
          lifeBalanceScores: profileDefaults.life_balance,
          personality_traits: [],
        };

        const { error: authError } = await supabase.auth.updateUser({
          data: metadataDefaults
        });

        if (authError) throw authError;

        toast.success("✅ All settings and profile data reset to defaults.");
      } catch (error: any) {
        console.error("Reset error:", error);
        toast.error("Failed to reset database data. Local settings were reset.");
      }
    } else {
      toast.info("Settings reset to defaults.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      // Calling the custom RPC function that deletes the auth user,
      // which will cascade down and wipe all user data across all tables.
      const { error } = await (supabase as any).rpc("delete_user");
      if (error) throw error;

      await supabase.auth.signOut();
      toast.success("Account permanently deleted. Hope to see you again!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account");
    }
  };

  const isThemeOwned = (id: ThemeId) => !THEMES[id].rewardId || purchased.has(THEMES[id].rewardId!);
  const isFrameOwned = (id: AvatarFrameId) => !AVATAR_FRAMES[id].rewardId || purchased.has(AVATAR_FRAMES[id].rewardId!);
  const isSoundOwned = (id: SoundPackId) => !SOUND_PACKS[id].rewardId || purchased.has(SOUND_PACKS[id].rewardId!);

  return (
    <div className="space-y-5 pb-12">

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
        <Card className="glass border-border/50 overflow-hidden shadow-xl">
          <div className="h-1 w-full bg-gradient-to-r from-primary to-primary-glow" />
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              <AvatarWithFrame
                avatarUrl={avatarUrl}
                fallback={userName.slice(0, 1).toUpperCase()}
                frameId={settings.avatarFrame}
                size="xl"
              />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-lg md:text-xl truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
                <Link to="/profile" className="flex-shrink-0">
                  <Button variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto">
                    <User className="w-3.5 h-3.5" /> Profile
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <Badge variant="outline" className="text-[10px] sm:text-xs py-0.5 px-2 border-primary/40 text-primary bg-primary/5">
                  {THEMES[settings.theme].icon} {THEMES[settings.theme].name}
                </Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs py-0.5 px-2 bg-secondary/30">
                  {AVATAR_FRAMES[settings.avatarFrame].icon} {AVATAR_FRAMES[settings.avatarFrame].name}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── 1. APPEARANCE & THEMES ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      <SectionCard icon={<Palette className="w-4 h-4" />} title="Appearance & Themes" description="Customize the look and feel of the entire app" delay={0.04}>

        {/* Light/Dark toggle */}
        <Row label="Color Mode" description="Switch between light and dark mode — your preference is saved automatically">
          <div className="flex items-center gap-2">
            <Sun className={`w-4 h-4 transition-colors ${!settings.darkMode ? "text-amber-500" : "text-muted-foreground"}`} />
            <Switch checked={settings.darkMode} onCheckedChange={(v) => updateSetting("darkMode", v)} />
            <Moon className={`w-4 h-4 transition-colors ${settings.darkMode ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        </Row>

        <Separator className="bg-border/30 my-1" />

        {/* Themes grid */}
        <div className="py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Dashboard Theme <span className="text-primary ml-1 font-normal normal-case">— click to apply instantly</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
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

        <div className="py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Avatar Frame</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
            {(Object.keys(AVATAR_FRAMES) as AvatarFrameId[]).map((id) => (
              <FrameCard
                key={id}
                frameId={id}
                active={settings.avatarFrame === id}
                owned={isFrameOwned(id)}
                userName={userName}
                avatarUrl={avatarUrl}
                onSelect={async () => {
                  updateSetting("avatarFrame", id);
                  if (user) {
                    await supabase.from("profiles").update({ avatar_frame: id } as any).eq("user_id", user.id);
                  }
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
          <Switch
            checked={settings.notifications}
            onCheckedChange={async (v) => {
              if (v) {
                const granted = await requestNotificationPermission();
                if (!granted) {
                  const perm = getNotificationPermission();
                  if (perm === "denied") {
                    toast.error("Notifications are blocked. Please enable them in your browser settings.");
                  } else {
                    toast.info("Please allow notifications when prompted by your browser.");
                  }
                  return;
                }
                updateSetting("notifications", true);
                // Send a test notification to confirm it works
                sendDeviceNotification("🔔 Notifications Enabled!", {
                  body: "You'll now receive device notifications from DailyDots.",
                  tag: "test-notification",
                });
                toast.success("Device notifications enabled!");
              } else {
                updateSetting("notifications", false);
                toast.info("Device notifications disabled.");
              }
            }}
          />
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
      {/* ── 6. SECURITY & ACCOUNT ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      <SectionCard icon={<ShieldCheck className="w-4 h-4" />} title="Security & Account" description="Manage your account security and data" delay={0.24}>
        <Row label="Email" description="Your login email address">
          <span className="text-xs text-muted-foreground font-mono bg-secondary/40 px-2 py-1 rounded-lg max-w-[200px] truncate block">
            {userEmail}
          </span>
        </Row>
        <Row label="Change Password" description="Send a password reset link to your email">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleResetPassword}>
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <RefreshCcw className="w-3.5 h-3.5" /> Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass border-border/50">
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will revert all your appearance, accessibility, and notification preferences to their default values. This cannot be undone.
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">Type "reset" to confirm:</p>
                    <Input
                      value={resetConfirm}
                      onChange={(e) => setResetConfirm(e.target.value.toLowerCase())}
                      placeholder="reset"
                      className="bg-secondary/30 border-border"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setResetConfirm("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  disabled={resetConfirm !== "reset"}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  Reset Settings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Row>
        <Row label="Delete Account" description="Permanently remove your account and all data — this cannot be undone" dangerous>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass border-destructive/20 border-2">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2 text-xl">
                  <Trash2 className="w-6 h-6" /> Destructive Action
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground space-y-4 pt-2">
                  <p className="font-bold text-foreground">You are about to permanently delete your account and all associated data including habits, streaks, and coins.</p>
                  <p>All your progress will be lost forever. There is no way to recover your data after this step.</p>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Type "delete" below to confirm account deletion:</p>
                    <Input
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value.toLowerCase())}
                      placeholder="delete"
                      className="bg-destructive/10 border-destructive/30 focus-visible:ring-destructive"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel onClick={() => setDeleteConfirm("")}>Keep My Account</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== "delete"}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Permanently Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Row>
      </SectionCard>

      {/* ── Sign Out ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
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
