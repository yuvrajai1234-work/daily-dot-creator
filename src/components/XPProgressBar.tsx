import { motion } from "framer-motion";
import { useLevelInfo, getLevelTier } from "@/hooks/useXP";
import { Zap, TrendingUp, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface XPProgressBarProps {
    compact?: boolean;
    showDetails?: boolean;
}

const XPProgressBar = ({ compact = false, showDetails = true }: XPProgressBarProps) => {
    const { data: levelInfo, isLoading } = useLevelInfo();

    if (isLoading || !levelInfo) {
        return null;
    }

    const tier = getLevelTier(levelInfo.level);

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50">
                    <Zap className="w-3 h-3" style={{ color: tier.color }} />
                    <span className="text-xs font-bold">Lv {levelInfo.level}</span>
                </div>
                <div className="flex-1 max-w-[100px] relative">
                    <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${levelInfo.progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="glass border-border/50 overflow-hidden relative">
                {/* Background glow effect */}
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at top right, ${tier.color}, transparent 70%)`
                    }}
                />

                <CardContent className="p-5 relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <motion.div
                                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                                style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}dd)` }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <Star className="w-6 h-6 text-white fill-white" />
                            </motion.div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-bold">Level {levelInfo.level}</h3>
                                    <span
                                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                        style={{
                                            background: `${tier.color}20`,
                                            color: tier.color,
                                        }}
                                    >
                                        {tier.name}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium">
                                    <span className="text-green-500 font-bold">{levelInfo.currentXP.toLocaleString()}</span>
                                    {" / "}
                                    <span className="text-foreground/70">{levelInfo.xpNeeded.toLocaleString()}</span>
                                    {" XP"}
                                </p>
                            </div>
                        </div>

                        {showDetails && (
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-xs font-semibold">Total</span>
                                </div>
                                <span className="text-sm font-mono font-bold text-foreground">
                                    {levelInfo.totalXP.toLocaleString()} XP
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="space-y-2">
                        <div className="relative h-3 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
                            {/* Animated green gradient fill */}
                            <motion.div
                                className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 bg-[length:200%_100%] animate-shimmer shadow-lg"
                                initial={{ width: 0 }}
                                animate={{ width: `${levelInfo.progress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                style={{
                                    boxShadow: "0 0 10px rgba(34, 197, 94, 0.5)",
                                }}
                            />

                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
                        </div>

                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium">
                                <span className="text-green-500 font-bold">{Math.round(levelInfo.progress)}%</span>
                                {" complete"}
                            </span>
                            <span className="font-mono text-muted-foreground">
                                <span className="text-orange-500 font-bold">
                                    {(levelInfo.xpNeeded - levelInfo.currentXP).toLocaleString()}
                                </span>
                                {" XP to Lv "}
                                <span className="font-bold">{levelInfo.level + 1}</span>
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default XPProgressBar;
