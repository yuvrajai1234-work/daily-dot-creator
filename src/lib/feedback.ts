import { AppSettings } from "@/contexts/ThemeContext";

/**
 * Utility to play sounds and provide haptic feedback
 */
export const provideFeedback = (
    type: 'click' | 'success' | 'complete' | 'achievement' | 'error',
    settings?: Partial<AppSettings>
) => {
    // 1. Haptic Feedback
    if (settings?.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
        switch (type) {
            case 'click':
                navigator.vibrate(10);
                break;
            case 'success':
            case 'complete':
                navigator.vibrate([20, 10, 20]);
                break;
            case 'achievement':
                navigator.vibrate([50, 20, 50, 20, 100]);
                break;
            case 'error':
                navigator.vibrate([100, 50, 100]);
                break;
        }
    }

    // 2. Sound Effects
    if (settings?.soundEffects) {
        const soundPack = settings.soundPack || 'default';
        const PACK_SOUNDS: Record<string, Record<string, string>> = {
            default: {
                click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
                success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
                complete: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
                achievement: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
                error: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
            },
            zen: {
                click: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
                success: 'https://assets.mixkit.co/active_storage/sfx/1423/1423-preview.mp3',
                complete: 'https://assets.mixkit.co/active_storage/sfx/1423/1423-preview.mp3',
                achievement: 'https://assets.mixkit.co/active_storage/sfx/544/544-preview.mp3',
                error: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
            },
            retro: {
                click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
                success: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
                complete: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3',
                achievement: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
                error: 'https://assets.mixkit.co/active_storage/sfx/2954/2954-preview.mp3',
            },
            orchestra: {
                click: 'https://assets.mixkit.co/active_storage/sfx/2863/2863-preview.mp3',
                success: 'https://assets.mixkit.co/active_storage/sfx/1434/1434-preview.mp3',
                complete: 'https://assets.mixkit.co/active_storage/sfx/1434/1434-preview.mp3',
                achievement: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
                error: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
            }
        };

        const activePack = PACK_SOUNDS[soundPack] || PACK_SOUNDS['default'];
        const soundUrl = activePack[type];


        if (soundUrl) {
            try {
                const audio = new Audio(soundUrl);
                audio.volume = 0.4;
                audio.play().catch(() => {}); // silent fail if browser blocks autoplay
            } catch (e) {
                console.warn("Could not play sound:", e);
            }
        }
    }
};

export const useFeedback = () => {
    try {
        const raw = localStorage.getItem("dd_settings_v2");
        const settings = raw ? JSON.parse(raw) : {};
        return (type: Parameters<typeof provideFeedback>[0]) => provideFeedback(type, settings);
    } catch {
        return (type: Parameters<typeof provideFeedback>[0]) => provideFeedback(type);
    }
};
