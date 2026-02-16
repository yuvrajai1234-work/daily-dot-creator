import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Star } from "lucide-react";
import confetti from "canvas-confetti";

interface LevelUpOverlayProps {
    newLevel: number;
    onClose: () => void;
}

export const LevelUpOverlay = ({ newLevel, onClose }: LevelUpOverlayProps) => {
    const [stage, setStage] = useState<"intro" | "shaking" | "transform" | "celebrate">("intro");
    const oldLevel = Math.max(1, newLevel - 1);

    useEffect(() => {
        // Sequence the animation stages
        const sequence = async () => {
            // Stage 1: Intro (Arrow up)
            await new Promise(r => setTimeout(r, 1000));
            setStage("shaking");

            // Stage 2: Shaking old level
            await new Promise(r => setTimeout(r, 1500));
            setStage("transform");

            // Stage 3: Transformation flash
            await new Promise(r => setTimeout(r, 200));
            setStage("celebrate");

            // Stage 4: Celebration (Confetti)
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#22c55e', '#eab308', '#ffffff'] // Green, Gold, White
            });

            // Audio effect could go here
        };

        sequence();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div className="relative flex flex-col items-center justify-center w-full h-full pointer-events-none">

                {/* Animated Green Arrow Background */}
                <motion.div
                    initial={{ y: 100, opacity: 0, scale: 0.5 }}
                    animate={{ y: -50, opacity: [0, 1, 0], scale: 1.5 }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    className="absolute text-green-500/20"
                >
                    <ArrowUp className="w-96 h-96" />
                </motion.div>

                {/* Level Up Text */}
                <motion.h2
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-600 mb-8 z-10 uppercase tracking-wider filter drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                >
                    Level Up!
                </motion.h2>

                {/* Level Transformation Container */}
                <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center z-10">

                    {/* Old Level (Shaking) */}
                    {(stage === "intro" || stage === "shaking") && (
                        <motion.div
                            key="old-level"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={stage === "shaking" ? {
                                scale: [1, 1.1, 0.9, 1.1, 1],
                                rotate: [0, -5, 5, -5, 0],
                                x: [0, -5, 5, -5, 0],
                                color: ["#ffffff", "#ef4444", "#ffffff"] // Turns slightly red from strain
                            } : { scale: 1, opacity: 1 }}
                            transition={stage === "intro" ? { duration: 0.5 } : { duration: 0.5, repeat: Infinity }}
                            className="absolute text-8xl md:text-9xl font-bold text-white border-4 border-white/20 rounded-full w-full h-full flex items-center justify-center glass"
                        >
                            {oldLevel}
                        </motion.div>
                    )}

                    {/* Flash Effect */}
                    <AnimatePresence>
                        {stage === "transform" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1.5 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 bg-white rounded-full z-20 blur-xl"
                            />
                        )}
                    </AnimatePresence>

                    {/* New Level (Glowing) */}
                    {stage === "celebrate" && (
                        <motion.div
                            key="new-level"
                            initial={{ scale: 0, opacity: 0, rotate: -180 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="absolute w-full h-full flex items-center justify-center"
                        >
                            {/* Glowing Ring */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 rounded-full border-4 border-dashed border-green-500/50"
                            />

                            <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500/20 to-emerald-900/40 backdrop-blur-md rounded-full border-4 border-green-400 shadow-[0_0_50px_rgba(74,222,128,0.6)]">
                                <span className="text-8xl md:text-9xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                                    {newLevel}
                                </span>

                                {/* Crown/Star Icon */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: -60, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute -top-4 text-yellow-400 filter drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                                >
                                    <Star className="w-16 h-16 fill-yellow-400" />
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Continue Text */}
                {stage === "celebrate" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="mt-12 pointer-events-auto"
                    >
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-white text-lg hover:scale-105 transition-transform shadow-lg shadow-green-500/30"
                        >
                            Continue Journey
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};
