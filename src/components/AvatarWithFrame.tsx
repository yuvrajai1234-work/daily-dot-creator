import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ── Frame definitions ────────────────────────────────────────────────────────
export const AVATAR_FRAMES = [
    {
        id: "none",
        name: "No Frame",
        emoji: "⬜",
        free: true,
        borderClass: "ring-2 ring-border",
        animationStyle: {} as React.CSSProperties,
    },
    {
        id: "golden",
        name: "Golden Frame",
        emoji: "🏆",
        free: false,
        borderClass: "ring-[3px] ring-yellow-400",
        animationStyle: {
            boxShadow: "0 0 0 3px #facc15, 0 0 12px 4px rgba(250,204,21,0.45)",
        } as React.CSSProperties,
    },
    {
        id: "animated",
        name: "Shimmer",
        emoji: "✨",
        free: false,
        borderClass: "ring-[3px] ring-blue-300",
        animationStyle: {
            boxShadow:
                "0 0 0 3px #93c5fd, 0 0 16px 6px rgba(147,197,253,0.5)",
            animation: "shimmerPulse 2s ease-in-out infinite",
        } as React.CSSProperties,
    },
    {
        id: "rainbow",
        name: "Rainbow",
        emoji: "🌈",
        free: false,
        borderClass: "",
        animationStyle: {} as React.CSSProperties,
        isRainbow: true,
    },
];

export type AvatarFrameId = "none" | "golden" | "animated" | "rainbow";

interface AvatarWithFrameProps {
    avatarUrl?: string;
    fallback: string;
    frameId?: AvatarFrameId | string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    onClick?: () => void;
    /** Show hover overlay */
    showHoverOverlay?: boolean;
}

const sizeMap = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-24 h-24",
};

const AvatarWithFrame = ({
    avatarUrl,
    fallback,
    frameId = "none",
    size = "lg",
    className,
    onClick,
    showHoverOverlay = false,
}: AvatarWithFrameProps) => {
    const frame = AVATAR_FRAMES.find((f) => f.id === frameId) ?? AVATAR_FRAMES[0];
    const isEmoji = avatarUrl && !avatarUrl.startsWith("http");

    if (frame.isRainbow) {
        return (
            <div
                className={cn("relative cursor-pointer group", className)}
                onClick={onClick}
                style={{ display: "inline-block" }}
            >
                {/* Rainbow border wrap */}
                <div
                    className={cn("rounded-full p-[3px]", sizeMap[size])}
                    style={{
                        background: "linear-gradient(135deg, #f43f5e, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #ec4899)",
                        boxShadow: "0 0 14px 4px rgba(168,85,247,0.4)",
                        animation: "rainbowRotate 4s linear infinite",
                    }}
                >
                    <Avatar className={cn("w-full h-full bg-background border-2 border-background")}>
                        {isEmoji ? (
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-primary/10">{avatarUrl}</div>
                        ) : (
                            <>
                                <AvatarImage src={avatarUrl} alt={fallback} />
                                <AvatarFallback className="bg-primary/20 text-primary font-bold">{fallback}</AvatarFallback>
                            </>
                        )}
                    </Avatar>
                </div>
                {showHoverOverlay && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-semibold">Change</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn("relative cursor-pointer group", className)}
            onClick={onClick}
            style={{ display: "inline-block" }}
        >
            <Avatar
                className={cn(sizeMap[size], frame.borderClass, "transition-all duration-300")}
                style={frame.animationStyle}
            >
                {isEmoji ? (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-primary/10">{avatarUrl}</div>
                ) : (
                    <>
                        <AvatarImage src={avatarUrl} alt={fallback} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">{fallback}</AvatarFallback>
                    </>
                )}
            </Avatar>
            {showHoverOverlay && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-semibold">Change</span>
                </div>
            )}
        </div>
    );
};

export default AvatarWithFrame;
