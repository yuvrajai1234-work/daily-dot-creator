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
        let soundUrl = '';

        // Using standard sound types. For now, we'll use CDNs for demonstration
        // until local assets are added.
        switch (type) {
            case 'click':
                soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
                break;
            case 'success':
            case 'complete':
                soundUrl = 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3';
                break;
            case 'achievement':
                soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';
                break;
            case 'error':
                soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3';
                break;
        }

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
