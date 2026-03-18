import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

// ─── Theme definitions ─────────────────────────────────────────────────────────
// Each theme overrides specific CSS variables on <html>
export type ThemeId =
    | "default"        // always unlocked — deep purple
    | "emerald"        // always unlocked — green
    | "ocean"          // always unlocked — cyan-blue
    | "pastel"         // reward id 1
    | "neon"           // reward id 2
    | "galaxy"         // reward id 3
    | "rose"           // reward id 4 (custom accent - rose)
    | "sunset"         // reward id 5
    | "arctic";        // reward id 6

export type AvatarFrameId = "none" | "golden" | "animated" | "rainbow";
export type SoundPackId = "default" | "zen" | "retro" | "orchestra";
export type AccentColorId = "purple" | "blue" | "emerald" | "rose" | "amber" | "cyan";

export interface AppSettings {
    // Appearance
    theme: ThemeId;
    darkMode: boolean;
    avatarFrame: AvatarFrameId;
    soundPack: SoundPackId;
    accentColor: AccentColorId;

    // Notifications
    notifications: boolean;
    dailyReminders: boolean;
    reminderTime: string;
    soundEffects: boolean;
    hapticFeedback: boolean;
    achievementAlerts: boolean;
    streakAlerts: boolean;

    // Habit
    cycleLength: string;
    defaultEffortLevel: number;
    showCompletedHabits: boolean;
    habitSortOrder: string;

    // Privacy
    profileVisibility: string;
    showOnLeaderboard: boolean;
    groupDiscovery: boolean;
    showStreak: boolean;
    showLevel: boolean;

    // AI
    aiCoachTone: string;
    personalizedSuggestions: boolean;
    reflectionHistory: string;
    weeklyInsights: boolean;

    // Accessibility
    reducedMotion: boolean;
    fontSize: string;
    highContrast: boolean;
    compactMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
    theme: "default",
    darkMode: true,
    avatarFrame: "none",
    soundPack: "default",
    accentColor: "purple",
    notifications: true,
    dailyReminders: true,
    reminderTime: "09:00",
    soundEffects: true,
    hapticFeedback: false,
    achievementAlerts: true,
    streakAlerts: true,
    cycleLength: "4-weeks",
    defaultEffortLevel: 3,
    showCompletedHabits: true,
    habitSortOrder: "created",
    profileVisibility: "public",
    showOnLeaderboard: true,
    groupDiscovery: true,
    showStreak: true,
    showLevel: true,
    aiCoachTone: "encouraging",
    personalizedSuggestions: true,
    reflectionHistory: "90-days",
    weeklyInsights: true,
    reducedMotion: false,
    fontSize: "medium",
    highContrast: false,
    compactMode: false,
};

// ─── Theme CSS variable maps ───────────────────────────────────────────────────
export const THEMES: Record<ThemeId, {
    name: string;
    icon: string;
    preview: [string, string];            // [from, to] for CSS gradient preview
    rewardId?: number;                    // if set, needs to be purchased
    vars: Record<string, string>;
}> = {
    default: {
        name: "Deep Purple",
        icon: "🟣",
        preview: ["hsl(262,83%,58%)", "hsl(310,70%,60%)"],
        vars: {
            "--primary": "262 83% 58%",
            "--primary-glow": "262 83% 70%",
            "--ring": "262 83% 58%",
            "--gradient-primary": "linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 70%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(262 83% 58%), hsl(310 70% 60%))",
            "--glass-border": "hsla(262, 83%, 58%, 0.2)",
            "--shadow-primary": "0 10px 30px -5px hsla(262, 83%, 58%, 0.3)",
            "--shadow-glow": "0 0 40px hsla(262, 83%, 58%, 0.4)",
            "--sidebar-primary": "262 83% 58%",
            "--sidebar-ring": "262 83% 58%",
        },
    },
    emerald: {
        name: "Forest Green",
        icon: "🟢",
        preview: ["hsl(142,76%,36%)", "hsl(160,60%,45%)"],
        vars: {
            "--primary": "142 76% 36%",
            "--primary-glow": "142 76% 50%",
            "--ring": "142 76% 36%",
            "--gradient-primary": "linear-gradient(135deg, hsl(142 76% 36%), hsl(160 60% 45%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(142 76% 36%), hsl(160 60% 55%))",
            "--glass-border": "hsla(142, 76%, 36%, 0.2)",
            "--shadow-primary": "0 10px 30px -5px hsla(142, 76%, 36%, 0.3)",
            "--shadow-glow": "0 0 40px hsla(142, 76%, 36%, 0.4)",
            "--sidebar-primary": "142 76% 36%",
            "--sidebar-ring": "142 76% 36%",
        },
    },
    ocean: {
        name: "Ocean Blue",
        icon: "🔵",
        preview: ["hsl(210,100%,50%)", "hsl(185,90%,45%)"],
        vars: {
            "--primary": "210 100% 50%",
            "--primary-glow": "210 100% 65%",
            "--ring": "210 100% 50%",
            "--gradient-primary": "linear-gradient(135deg, hsl(210 100% 50%), hsl(185 90% 45%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(210 100% 45%), hsl(185 90% 55%))",
            "--glass-border": "hsla(210, 100%, 50%, 0.2)",
            "--shadow-primary": "0 10px 30px -5px hsla(210, 100%, 50%, 0.3)",
            "--shadow-glow": "0 0 40px hsla(210, 100%, 50%, 0.4)",
            "--sidebar-primary": "210 100% 50%",
            "--sidebar-ring": "210 100% 50%",
        },
    },
    pastel: {
        name: "Pastel Dream",
        icon: "🎨",
        preview: ["hsl(300,60%,70%)", "hsl(200,60%,70%)"],
        rewardId: 1,
        vars: {
            "--primary": "300 60% 55%",
            "--primary-glow": "300 60% 68%",
            "--ring": "300 60% 55%",
            "--gradient-primary": "linear-gradient(135deg, hsl(300 60% 55%), hsl(200 60% 60%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(300 60% 48%), hsl(200 60% 65%))",
            "--glass-border": "hsla(300, 60%, 55%, 0.25)",
            "--shadow-primary": "0 10px 30px -5px hsla(300, 60%, 55%, 0.35)",
            "--shadow-glow": "0 0 40px hsla(300, 60%, 55%, 0.45)",
            "--sidebar-primary": "300 60% 55%",
            "--sidebar-ring": "300 60% 55%",
        },
    },
    neon: {
        name: "Neon Glow",
        icon: "💡",
        preview: ["hsl(120,100%,50%)", "hsl(60,100%,50%)"],
        rewardId: 2,
        vars: {
            "--primary": "120 100% 35%",
            "--primary-glow": "120 100% 50%",
            "--ring": "120 100% 35%",
            "--gradient-primary": "linear-gradient(135deg, hsl(120 100% 35%), hsl(60 100% 45%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(120 100% 30%), hsl(60 100% 50%))",
            "--glass-border": "hsla(120, 100%, 40%, 0.3)",
            "--shadow-primary": "0 10px 30px -5px hsla(120, 100%, 40%, 0.5)",
            "--shadow-glow": "0 0 60px hsla(120, 100%, 40%, 0.6)",
            "--sidebar-primary": "120 100% 35%",
            "--sidebar-ring": "120 100% 35%",
        },
    },
    galaxy: {
        name: "Dark Galaxy",
        icon: "🌌",
        preview: ["hsl(250,80%,50%)", "hsl(180,100%,40%)"],
        rewardId: 3,
        vars: {
            "--primary": "250 80% 55%",
            "--primary-glow": "250 80% 70%",
            "--ring": "250 80% 55%",
            "--gradient-primary": "linear-gradient(135deg, hsl(250 80% 55%), hsl(180 100% 38%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(250 80% 48%), hsl(180 100% 45%))",
            "--glass-border": "hsla(250, 80%, 55%, 0.25)",
            "--shadow-primary": "0 10px 30px -5px hsla(250, 80%, 55%, 0.4)",
            "--shadow-glow": "0 0 60px hsla(250, 80%, 55%, 0.5)",
            "--sidebar-primary": "250 80% 55%",
            "--sidebar-ring": "250 80% 55%",
        },
    },
    rose: {
        name: "Rose Gold",
        icon: "🌹",
        preview: ["hsl(340,80%,55%)", "hsl(20,90%,60%)"],
        rewardId: 4,
        vars: {
            "--primary": "340 80% 50%",
            "--primary-glow": "340 80% 63%",
            "--ring": "340 80% 50%",
            "--gradient-primary": "linear-gradient(135deg, hsl(340 80% 50%), hsl(20 90% 55%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(340 80% 45%), hsl(20 90% 60%))",
            "--glass-border": "hsla(340, 80%, 50%, 0.2)",
            "--shadow-primary": "0 10px 30px -5px hsla(340, 80%, 50%, 0.35)",
            "--shadow-glow": "0 0 40px hsla(340, 80%, 50%, 0.45)",
            "--sidebar-primary": "340 80% 50%",
            "--sidebar-ring": "340 80% 50%",
        },
    },
    sunset: {
        name: "Sunset Fire",
        icon: "🌅",
        preview: ["hsl(25,100%,55%)", "hsl(350,90%,55%)"],
        rewardId: 5,
        vars: {
            "--primary": "25 100% 48%",
            "--primary-glow": "25 100% 60%",
            "--ring": "25 100% 48%",
            "--gradient-primary": "linear-gradient(135deg, hsl(25 100% 48%), hsl(350 90% 50%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(25 100% 43%), hsl(350 90% 55%))",
            "--glass-border": "hsla(25, 100%, 50%, 0.2)",
            "--shadow-primary": "0 10px 30px -5px hsla(25, 100%, 50%, 0.35)",
            "--shadow-glow": "0 0 40px hsla(25, 100%, 50%, 0.45)",
            "--sidebar-primary": "25 100% 48%",
            "--sidebar-ring": "25 100% 48%",
        },
    },
    arctic: {
        name: "Arctic White",
        icon: "❄️",
        preview: ["hsl(200,60%,55%)", "hsl(220,40%,70%)"],
        rewardId: 6,
        vars: {
            "--primary": "200 80% 45%",
            "--primary-glow": "200 80% 60%",
            "--ring": "200 80% 45%",
            "--gradient-primary": "linear-gradient(135deg, hsl(200 80% 45%), hsl(220 60% 55%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(200 80% 40%), hsl(220 60% 60%))",
            "--glass-border": "hsla(200, 80%, 50%, 0.2)",
            "--shadow-primary": "0 10px 30px -5px hsla(200, 80%, 50%, 0.3)",
            "--shadow-glow": "0 0 40px hsla(200, 80%, 50%, 0.4)",
            "--sidebar-primary": "200 80% 45%",
            "--sidebar-ring": "200 80% 45%",
        },
    },
};

export const AVATAR_FRAMES: Record<AvatarFrameId, { name: string; icon: string; rewardId?: number; css: string }> = {
    none: { name: "No Frame", icon: "⬜", css: "" },
    golden: { name: "Golden Frame", icon: "🖼️", rewardId: 13, css: "ring-4 ring-amber-400 ring-offset-2 ring-offset-background" },
    animated: { name: "Shimmer", icon: "✨", rewardId: 14, css: "ring-4 ring-purple-400 ring-offset-2 ring-offset-background animate-pulse" },
    rainbow: { name: "Rainbow", icon: "🌈", rewardId: 15, css: "ring-4 ring-offset-2 ring-offset-background [--tw-ring-color:transparent] [background:linear-gradient(white,white)_padding-box,linear-gradient(90deg,red,orange,yellow,green,blue,violet)_border-box] border-4 border-transparent" },
};

export const SOUND_PACKS: Record<SoundPackId, { name: string; icon: string; rewardId?: number }> = {
    default: { name: "Default", icon: "🔊" },
    zen: { name: "Zen Bells", icon: "🔔", rewardId: 19 },
    retro: { name: "Retro 8-Bit", icon: "🎮", rewardId: 20 },
    orchestra: { name: "Epic Orchestra", icon: "🎻", rewardId: 21 },
};

// ─── Context ───────────────────────────────────────────────────────────────────
const SETTINGS_KEY = "dd_settings_v2";

const loadSettings = (): AppSettings => {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        const parsed = JSON.parse(raw);
        // Always reset avatarFrame to "none" on cold load.
        // The ThemeContext will sync the correct frame from the DB
        // after auth, preventing locked frames from bleeding over
        // when users share a device or switch accounts.
        parsed.avatarFrame = "none";
        return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
        return DEFAULT_SETTINGS;
    }
};

interface ThemeContextValue {
    settings: AppSettings;
    updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
    updateSettings: (partial: Partial<AppSettings>) => void;
    saveSettings: () => void;
    resetSettings: () => void;
    applyTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Apply theme to DOM ────────────────────────────────────────────────────────
// We MUST explicitly set all surface/foreground vars based on darkMode because
// old inline styles from previous sessions can persist (esp. during HMR) and
// override CSS :root / .dark rules.
const DARK_SURFACE_VARS: Record<string, string> = {
    "--background": "240 10% 3.9%",
    "--foreground": "0 0% 98%",
    "--card": "240 10% 3.9%",
    "--card-foreground": "0 0% 98%",
    "--popover": "240 10% 3.9%",
    "--popover-foreground": "0 0% 98%",
    "--secondary": "240 3.7% 15.9%",
    "--secondary-foreground": "0 0% 98%",
    "--muted": "240 3.7% 15.9%",
    "--muted-foreground": "240 5% 64.9%",
    "--accent": "240 3.7% 15.9%",
    "--accent-foreground": "0 0% 98%",
    "--border": "240 3.7% 15.9%",
    "--input": "240 3.7% 15.9%",
    "--glass-bg": "hsla(240, 10%, 10%, 0.8)",
    "--shadow-card": "0 8px 32px hsla(0, 0%, 0%, 0.4)",
    "--sidebar-background": "240 10% 6%",
    "--sidebar-foreground": "0 0% 98%",
    "--sidebar-accent": "240 3.7% 15.9%",
    "--sidebar-accent-foreground": "0 0% 98%",
    "--sidebar-border": "240 3.7% 15.9%",
};

const LIGHT_SURFACE_VARS: Record<string, string> = {
    "--background": "0 0% 96%",
    "--foreground": "240 10% 8%",
    "--card": "0 0% 100%",
    "--card-foreground": "240 10% 8%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "240 10% 8%",
    "--secondary": "240 5% 90%",
    "--secondary-foreground": "240 10% 20%",
    "--muted": "240 5% 90%",
    "--muted-foreground": "240 5% 45%",
    "--accent": "240 5% 90%",
    "--accent-foreground": "240 10% 20%",
    "--border": "240 5% 82%",
    "--input": "240 5% 82%",
    "--glass-bg": "hsla(0, 0%, 100%, 0.75)",
    "--shadow-card": "0 4px 24px hsla(0, 0%, 0%, 0.08)",
    "--sidebar-background": "0 0% 100%",
    "--sidebar-foreground": "240 10% 12%",
    "--sidebar-accent": "240 5% 93%",
    "--sidebar-accent-foreground": "240 10% 12%",
    "--sidebar-border": "240 5% 88%",
};

const applyThemeToDom = (themeId: ThemeId, darkMode: boolean, reducedMotion: boolean, compactMode: boolean, highContrast: boolean, fontSize: string) => {
    const root = document.documentElement;
    const theme = THEMES[themeId] || THEMES.default;

    // 1. Apply surface vars first (overrides any stale inline styles)
    const surfaceVars = darkMode ? DARK_SURFACE_VARS : LIGHT_SURFACE_VARS;
    Object.entries(surfaceVars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });

    // 2. Apply theme accent/primary overrides on top
    Object.entries(theme.vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });

    // 3. Toggle dark class
    root.classList.toggle("dark", darkMode);

    // 4. Font size
    const sizeMap: Record<string, string> = { small: "14px", medium: "16px", large: "18px", "x-large": "20px" };
    root.style.fontSize = sizeMap[fontSize] || "16px";

    // 5. Accessibility classes
    root.classList.toggle("motion-reduce", reducedMotion);
    root.classList.toggle("compact-mode", compactMode);
    root.classList.toggle("high-contrast", highContrast);

    // 6. Meta theme-color
    const metaTheme = document.querySelector("meta[name='theme-color']");
    if (metaTheme) {
        metaTheme.setAttribute("content", theme.preview[0]);
    }
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(loadSettings);

    // Apply theme on mount and whenever relevant settings change
    useEffect(() => {
        applyThemeToDom(settings.theme, settings.darkMode, settings.reducedMotion, settings.compactMode, settings.highContrast, settings.fontSize);
    }, [settings.theme, settings.darkMode, settings.reducedMotion, settings.compactMode, settings.highContrast, settings.fontSize]);

    // Sync remote profile settings to local state on initial load
    const { user } = useAuth();
    useEffect(() => {
        if (!user) return;
        const fetchRemoteSettings = async () => {
            const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
            if (data) {
                const remoteSettings: Partial<AppSettings> = {
                    profileVisibility: (data as any).profile_visibility || 'public',
                    showOnLeaderboard: (data as any).show_on_leaderboard ?? true,
                    groupDiscovery: (data as any).group_discovery ?? true,
                    showStreak: (data as any).show_streak ?? true,
                    showLevel: (data as any).show_level ?? true,
                };

                // Sync avatar frame from DB — prevents a locked frame from
                // bleeding over via localStorage when users switch accounts
                const dbFrame = (data as any).avatar_frame as AvatarFrameId | null;
                if (dbFrame && dbFrame in AVATAR_FRAMES) {
                    // Check the user actually owns that frame (reward check)
                    const purchasedArray: number[] = (data as any).unlocked_rewards || [];
                    const purchased = new Set(purchasedArray);
                    const frameEntry = AVATAR_FRAMES[dbFrame];
                    const ownsFrame = !frameEntry.rewardId || purchased.has(frameEntry.rewardId);
                    remoteSettings.avatarFrame = ownsFrame ? dbFrame : "none";
                } else {
                    // No frame in DB yet — clear any leftover from localStorage
                    remoteSettings.avatarFrame = "none";
                }

                updateSettings(remoteSettings);
            }
        };
        fetchRemoteSettings();
    }, [user?.id]);

    const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings((prev) => {
            const next = { ...prev, [key]: value };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
            return next;
        });

        // Persist specific privacy settings to database if user is logged in
        if (user) {
            const privacyKeys: (keyof AppSettings)[] = [
                'profileVisibility',
                'showOnLeaderboard',
                'groupDiscovery',
                'showStreak',
                'showLevel'
            ];

            if (privacyKeys.includes(key)) {
                // Map frontend keys to backend columns
                const columnMap: Record<string, string> = {
                    profileVisibility: 'profile_visibility',
                    showOnLeaderboard: 'show_on_leaderboard',
                    groupDiscovery: 'group_discovery',
                    showStreak: 'show_streak',
                    showLevel: 'show_level'
                };

                const column = columnMap[key as string];
                supabase
                    .from('profiles')
                    .update({ [column]: value })
                    .eq('user_id', user.id)
                    .then(({ error }) => {
                        if (error) console.error(`Error updating remote ${key}:`, error);
                    });
            }
        }
    }, [user?.id]);

    const updateSettings = useCallback((partial: Partial<AppSettings>) => {
        setSettings((prev) => {
            const next = { ...prev, ...partial };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const saveSettings = useCallback(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [settings]);

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }, []);

    const applyTheme = useCallback((id: ThemeId) => {
        updateSetting("theme", id);
    }, [updateSetting]);

    return (
        <ThemeContext.Provider value={{ settings, updateSetting, updateSettings, saveSettings, resetSettings, applyTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useTheme = (): ThemeContextValue => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
};
