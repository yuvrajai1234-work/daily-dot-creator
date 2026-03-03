import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

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
            "--background": "240 10% 3.9%",
            "--card": "240 10% 3.9%",
            "--popover": "240 10% 3.9%",
            "--secondary": "240 3.7% 15.9%",
            "--muted": "240 3.7% 15.9%",
            "--accent": "240 3.7% 15.9%",
            "--border": "240 3.7% 15.9%",
            "--input": "240 3.7% 15.9%",
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
            "--background": "150 15% 4%",
            "--card": "150 15% 4%",
            "--popover": "150 15% 4%",
            "--secondary": "150 10% 14%",
            "--muted": "150 10% 14%",
            "--accent": "150 10% 14%",
            "--border": "150 10% 14%",
            "--input": "150 10% 14%",
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
            "--background": "220 25% 4%",
            "--card": "220 25% 4%",
            "--popover": "220 25% 4%",
            "--secondary": "220 15% 14%",
            "--muted": "220 15% 14%",
            "--accent": "220 15% 14%",
            "--border": "220 15% 14%",
            "--input": "220 15% 14%",
        },
    },
    pastel: {
        name: "Pastel Dream",
        icon: "🎨",
        preview: ["hsl(300,60%,70%)", "hsl(200,60%,70%)"],
        rewardId: 1,
        vars: {
            "--primary": "300 60% 62%",
            "--primary-glow": "300 60% 75%",
            "--ring": "300 60% 62%",
            "--gradient-primary": "linear-gradient(135deg, hsl(300 60% 62%), hsl(200 60% 65%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(300 60% 55%), hsl(200 60% 70%))",
            "--glass-border": "hsla(300, 60%, 62%, 0.25)",
            "--shadow-primary": "0 10px 30px -5px hsla(300, 60%, 62%, 0.35)",
            "--shadow-glow": "0 0 40px hsla(300, 60%, 62%, 0.45)",
            "--sidebar-primary": "300 60% 62%",
            "--sidebar-ring": "300 60% 62%",
            "--background": "280 15% 5%",
            "--card": "280 15% 5%",
            "--popover": "280 15% 5%",
            "--secondary": "280 8% 16%",
            "--muted": "280 8% 16%",
            "--accent": "280 8% 16%",
            "--border": "280 8% 16%",
            "--input": "280 8% 16%",
        },
    },
    neon: {
        name: "Neon Glow",
        icon: "💡",
        preview: ["hsl(120,100%,50%)", "hsl(60,100%,50%)"],
        rewardId: 2,
        vars: {
            "--primary": "120 100% 45%",
            "--primary-glow": "120 100% 60%",
            "--ring": "120 100% 45%",
            "--gradient-primary": "linear-gradient(135deg, hsl(120 100% 45%), hsl(60 100% 50%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(120 100% 40%), hsl(60 100% 55%))",
            "--glass-border": "hsla(120, 100%, 45%, 0.3)",
            "--shadow-primary": "0 10px 30px -5px hsla(120, 100%, 45%, 0.5)",
            "--shadow-glow": "0 0 60px hsla(120, 100%, 45%, 0.6)",
            "--sidebar-primary": "120 100% 45%",
            "--sidebar-ring": "120 100% 45%",
            "--background": "130 20% 3%",
            "--card": "130 20% 3%",
            "--popover": "130 20% 3%",
            "--secondary": "130 10% 12%",
            "--muted": "130 10% 12%",
            "--accent": "130 10% 12%",
            "--border": "130 12% 14%",
            "--input": "130 12% 14%",
        },
    },
    galaxy: {
        name: "Dark Galaxy",
        icon: "🌌",
        preview: ["hsl(250,80%,50%)", "hsl(180,100%,40%)"],
        rewardId: 3,
        vars: {
            "--primary": "250 80% 60%",
            "--primary-glow": "250 80% 75%",
            "--ring": "250 80% 60%",
            "--gradient-primary": "linear-gradient(135deg, hsl(250 80% 60%), hsl(180 100% 40%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(250 80% 50%), hsl(180 100% 50%))",
            "--glass-border": "hsla(250, 80%, 60%, 0.25)",
            "--shadow-primary": "0 10px 30px -5px hsla(250, 80%, 60%, 0.4)",
            "--shadow-glow": "0 0 60px hsla(250, 80%, 60%, 0.5)",
            "--sidebar-primary": "250 80% 60%",
            "--sidebar-ring": "250 80% 60%",
            "--background": "245 30% 3%",
            "--card": "245 30% 3%",
            "--popover": "245 30% 3%",
            "--secondary": "245 15% 12%",
            "--muted": "245 15% 12%",
            "--accent": "245 15% 12%",
            "--border": "245 15% 13%",
            "--input": "245 15% 13%",
        },
    },
    rose: {
        name: "Rose Gold",
        icon: "🌹",
        preview: ["hsl(340,80%,55%)", "hsl(20,90%,60%)"],
        rewardId: 4,
        vars: {
            "--primary": "340 80% 55%",
            "--primary-glow": "340 80% 68%",
            "--ring": "340 80% 55%",
            "--gradient-primary": "linear-gradient(135deg, hsl(340 80% 55%), hsl(20 90% 60%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(340 80% 50%), hsl(20 90% 65%))",
            "--glass-border": "hsla(340, 80%, 55%, 0.2)",
            "--shadow-primary": "0 10px 30px -5px hsla(340, 80%, 55%, 0.35)",
            "--shadow-glow": "0 0 40px hsla(340, 80%, 55%, 0.45)",
            "--sidebar-primary": "340 80% 55%",
            "--sidebar-ring": "340 80% 55%",
            "--background": "340 20% 4%",
            "--card": "340 20% 4%",
            "--popover": "340 20% 4%",
            "--secondary": "340 10% 14%",
            "--muted": "340 10% 14%",
            "--accent": "340 10% 14%",
            "--border": "340 10% 14%",
            "--input": "340 10% 14%",
        },
    },
    sunset: {
        name: "Sunset Fire",
        icon: "🌅",
        preview: ["hsl(25,100%,55%)", "hsl(350,90%,55%)"],
        rewardId: 5,
        vars: {
            "--primary": "25 100% 55%",
            "--primary-glow": "25 100% 68%",
            "--ring": "25 100% 55%",
            "--gradient-primary": "linear-gradient(135deg, hsl(25 100% 55%), hsl(350 90% 55%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(25 100% 50%), hsl(350 90% 60%))",
            "--glass-border": "hsla(25, 100%, 55%, 0.2)",
            "--shadow-primary": "0 10px 30px -5px hsla(25, 100%, 55%, 0.35)",
            "--shadow-glow": "0 0 40px hsla(25, 100%, 55%, 0.45)",
            "--sidebar-primary": "25 100% 55%",
            "--sidebar-ring": "25 100% 55%",
            "--background": "20 20% 4%",
            "--card": "20 20% 4%",
            "--popover": "20 20% 4%",
            "--secondary": "20 10% 14%",
            "--muted": "20 10% 14%",
            "--accent": "20 10% 14%",
            "--border": "20 8% 14%",
            "--input": "20 8% 14%",
        },
    },
    arctic: {
        name: "Arctic White",
        icon: "❄️",
        preview: ["hsl(200,60%,55%)", "hsl(220,40%,70%)"],
        rewardId: 6,
        vars: {
            "--primary": "200 80% 50%",
            "--primary-glow": "200 80% 65%",
            "--ring": "200 80% 50%",
            "--gradient-primary": "linear-gradient(135deg, hsl(200 80% 50%), hsl(220 60% 60%))",
            "--gradient-hero": "linear-gradient(135deg, hsl(200 80% 45%), hsl(220 60% 65%))",
            "--glass-border": "hsla(200, 80%, 50%, 0.2)",
            "--shadow-primary": "0 10px 30px -5px hsla(200, 80%, 50%, 0.3)",
            "--shadow-glow": "0 0 40px hsla(200, 80%, 50%, 0.4)",
            "--sidebar-primary": "200 80% 50%",
            "--sidebar-ring": "200 80% 50%",
            "--background": "215 30% 5%",
            "--card": "215 30% 5%",
            "--popover": "215 30% 5%",
            "--secondary": "215 15% 14%",
            "--muted": "215 15% 14%",
            "--accent": "215 15% 14%",
            "--border": "215 15% 14%",
            "--input": "215 15% 14%",
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
        return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
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
const applyThemeToDom = (themeId: ThemeId, reducedMotion: boolean, compactMode: boolean, highContrast: boolean, fontSize: string) => {
    const root = document.documentElement;
    const theme = THEMES[themeId] || THEMES.default;

    // Apply CSS vars
    Object.entries(theme.vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });

    // Font size
    const sizeMap: Record<string, string> = { small: "14px", medium: "16px", large: "18px", "x-large": "20px" };
    root.style.fontSize = sizeMap[fontSize] || "16px";

    // Toggle classes
    root.classList.toggle("motion-reduce", reducedMotion);
    root.classList.toggle("compact-mode", compactMode);
    root.classList.toggle("high-contrast", highContrast);

    // Update meta theme-color
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
        applyThemeToDom(settings.theme, settings.reducedMotion, settings.compactMode, settings.highContrast, settings.fontSize);
    }, [settings.theme, settings.reducedMotion, settings.compactMode, settings.highContrast, settings.fontSize]);

    const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings((prev) => {
            const next = { ...prev, [key]: value };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

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
