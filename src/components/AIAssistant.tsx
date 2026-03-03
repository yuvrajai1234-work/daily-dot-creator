import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Loader2, Sparkles, User, Trophy, Zap, Target, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useHabits, useTodayCompletions, useAllCompletions, useReflections } from "@/hooks/useHabits";
import { useUserStats, useAchievements, useUserAchievements } from "@/hooks/useAchievements";
import { useLevelInfo } from "@/hooks/useXP";
import { useAuth } from "@/components/AuthProvider";

// ─── Groq API (OpenAI-compatible, generous free tier) ────────────────────────
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile"; // free: 14,400 req/day, 131k ctx

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

// ─── Quick prompt suggestions ──────────────────────────────────────────────────
const QUICK_PROMPTS = [
    { icon: Target, label: "Analyze my habits", prompt: "Analyze my current habits and give me detailed recommendations." },
    { icon: Zap, label: "Boost my motivation", prompt: "Give me a personalized motivational message based on my progress." },
    { icon: Trophy, label: "Next achievement", prompt: "Which achievement should I focus on next and how do I get there?" },
    { icon: BookOpen, label: "Journaling tips", prompt: "Give me tips to improve my journaling habit based on my current stats." },
];

// ─── Markdown-lite renderer ────────────────────────────────────────────────────
const renderMarkdown = (text: string) => {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-secondary/60 px-1 rounded text-xs font-mono">$1</code>')
        .replace(/^#{1,3} (.+)$/gm, '<p class="font-bold text-primary mt-2 mb-1">$1</p>')
        .replace(/^[-•] (.+)$/gm, '<li class="ml-3 list-disc list-inside text-sm">$1</li>')
        .replace(/\n\n/g, '</p><p class="mt-2">')
        .replace(/\n/g, '<br/>');
};

// ─── Build compact system prompt ──────────────────────────────────────────────
const buildSystemPrompt = (ctx: {
    profile: any; habits: any[]; todayCompletions: any[];
    allCompletions: any[]; reflections: any[]; stats: any;
    levelInfo: any; achievements: any[]; userAchievements: any[];
    userName: string;
}) => {
    const { profile, habits, todayCompletions, allCompletions, reflections,
        stats, levelInfo, achievements, userAchievements, userName } = ctx;

    const active = habits.filter(h => !h.is_archived);
    const doneIds = new Set(todayCompletions.map(c => c.habit_id));
    const doneCnt = active.filter(h => doneIds.has(h.id)).length;
    const pending = active.filter(h => !doneIds.has(h.id)).map(h => h.name).slice(0, 5);
    const pct = active.length ? Math.round(doneCnt / active.length * 100) : 0;

    const cntMap: Record<string, number> = {};
    allCompletions.forEach(c => { cntMap[c.habit_id] = (cntMap[c.habit_id] || 0) + 1; });

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const locked = achievements.filter(a => !unlockedIds.has(a.id)).slice(0, 6);

    const height = (profile as any)?.height_cm;
    const weight = (profile as any)?.weight_kg;
    const bmi = height && weight ? (weight / Math.pow(height / 100, 2)).toFixed(1) : null;

    const habitLines = active.slice(0, 10).map(h =>
        `${h.icon}${h.name}:${doneIds.has(h.id) ? 'done' : 'pending'},total=${cntMap[h.id] || 0}`
    ).join('; ');

    const reflSnippet = reflections.slice(0, 2).map(r =>
        `[${r.reflection_date}]${r.content?.slice(0, 80) ?? ''}`
    ).join(' | ');

    const nextAch = locked.slice(0, 4).map(a =>
        `${a.name}(need ${a.requirement_value} ${a.requirement_type})`
    ).join(', ');

    return `You are DailyDots AI Coach for ${userName}. Be warm, specific, use their real data. Keep answers concise with bullet points.

APP: Habit tracker with 28-day cycles, A/B/P coins (A=achievements, B=activity spend, P=premium), XP levels, 100+ achievements, rewards shop, community, journal, analytics, calendar.

USER DATA (${new Date().toLocaleDateString('en-IN')}):
Level ${levelInfo?.level ?? '?'} | XP ${levelInfo?.totalXP ?? 0} (${levelInfo?.progress ?? 0}% to next)
Streak: ${stats?.currentStreak ?? 0}d current, ${stats?.bestStreak ?? 0}d best | Active ${stats?.daysActive ?? 0}d
Coins: A=${(profile as any)?.a_coin_balance ?? 0} B=${(profile as any)?.b_coin_balance ?? 0} P=${(profile as any)?.p_coin_balance ?? 0}
Completions: ${stats?.totalCompletions ?? 0} total | Journals: ${stats?.totalReflections ?? 0}${bmi ? ` | BMI: ${bmi}` : ''}
Achievements: ${unlockedIds.size}/${achievements.length} unlocked
Today: ${doneCnt}/${active.length} done (${pct}%)${pending.length ? `, still pending: ${pending.join(', ')}` : ' - all done!'}
Habits: ${habitLines || 'none yet'}
Recent journal: ${reflSnippet || 'none'}
Next achievements to unlock: ${nextAch || 'all done!'}

Rules: Always cite real numbers. Reference habits by name. Flag if data missing.`;
};

// ─── Main Component ────────────────────────────────────────────────────────────
const AIAssistant = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Fetch all user data
    const { data: profile } = useProfile();
    const { data: habits = [] } = useHabits();
    const { data: todayCompletions = [] } = useTodayCompletions();
    const { data: allCompletions = [] } = useAllCompletions();
    const { data: reflections = [] } = useReflections();
    const { data: stats } = useUserStats();
    const { data: levelInfo } = useLevelInfo();
    const { data: achievements = [] } = useAchievements();
    const { data: userAchievements = [] } = useUserAchievements();

    const userName = (profile as any)?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
    const userEmail = user?.email || "";

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 300);
            if (messages.length === 0) {
                // Welcome message
                setMessages([{
                    role: "assistant",
                    content: `Hey ${userName}! 👋 I'm your **DailyDots AI Coach**. I have full access to your habits, stats, achievements and progress.\n\nI can:\n- 📊 Analyze your habit patterns\n- 🎯 Recommend what to focus on\n- 🏆 Guide you toward achievements\n- 💡 Answer any questions about the app\n- 💪 Motivate you with personalized insights\n\nWhat would you like to explore today?`,
                    timestamp: new Date(),
                }]);
            }
        }
    }, [open]);

    const buildContext = useCallback(() => ({
        profile, habits, todayCompletions, allCompletions, reflections,
        stats, levelInfo, achievements, userAchievements, userName,
    }), [profile, habits, todayCompletions, allCompletions, reflections, stats, levelInfo, achievements, userAchievements, userName]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || loading) return;

        if (!GROQ_KEY) {
            setError("⚠️ VITE_GROQ_API_KEY is not set. Add your Groq key to the .env file.");
            return;
        }

        const userMsg: Message = { role: "user", content: text.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);
        setError(null);

        try {
            const systemPrompt = buildSystemPrompt(buildContext());

            // Build OpenAI-compatible messages array (last 4 turns to save tokens)
            const history = messages.slice(-4).map(m => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.content,
            }));

            const body = {
                model: GROQ_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history,
                    { role: "user", content: text.trim() },
                ],
                temperature: 0.8,
                max_tokens: 512,
                top_p: 0.95,
                stream: false,
            };

            const res = await fetch(GROQ_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_KEY}`,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData?.error?.message || `Groq API error ${res.status}`);
            }

            const data = await res.json();
            const reply = data?.choices?.[0]?.message?.content;

            if (!reply) throw new Error("Empty response from Groq");

            setMessages(prev => [...prev, {
                role: "assistant",
                content: reply,
                timestamp: new Date(),
            }]);
        } catch (err: any) {
            setError(err.message || "Failed to get response. Check your API key.");
        } finally {
            setLoading(false);
        }
    }, [loading, messages, buildContext]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError(null);
        setTimeout(() => {
            setMessages([{
                role: "assistant",
                content: `Chat cleared! I'm still here with all your data loaded, ${userName}. What would you like to know? 😊`,
                timestamp: new Date(),
            }]);
        }, 100);
    };

    return (
        <>
            {/* ── Floating button ── */}
            <motion.button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 1 }}
                title="AI Assistant"
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <X className="w-6 h-6" />
                        </motion.span>
                    ) : (
                        <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <Sparkles className="w-6 h-6" />
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* ── Chat Panel ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20, originX: 1, originY: 1 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        className="fixed bottom-24 right-6 z-50 w-[min(420px,calc(100vw-24px))] h-[min(600px,calc(100vh-120px))] rounded-2xl border border-border/60 bg-[hsl(var(--card))] shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-gradient-to-r from-primary/20 to-transparent flex-shrink-0">
                            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm">DailyDots AI Coach</p>
                                <p className="text-[10px] text-muted-foreground">Powered by Groq · Knows your data</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={clearChat} title="Clear chat" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Stats strip */}
                        <div className="flex items-center gap-3 px-4 py-2 bg-secondary/20 border-b border-border/20 flex-shrink-0 text-[10px] text-muted-foreground overflow-x-auto">
                            <span className="flex items-center gap-1 whitespace-nowrap"><Zap className="w-3 h-3 text-primary" /> Lv.{levelInfo?.level ?? "?"}</span>
                            <span>·</span>
                            <span className="whitespace-nowrap">🔥 {stats?.currentStreak ?? 0}d streak</span>
                            <span>·</span>
                            <span className="whitespace-nowrap">✅ {todayCompletions.length}/{habits.filter(h => !h.is_archived).length} today</span>
                            <span>·</span>
                            <span className="whitespace-nowrap">🏆 {userAchievements.length} achievements</span>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Bot className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-br-sm"
                                        : "bg-secondary/60 text-foreground rounded-bl-sm border border-border/30"
                                        }`}>
                                        {msg.role === "assistant" ? (
                                            <div
                                                className="prose-sm"
                                                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                                            />
                                        ) : (
                                            <p>{msg.content}</p>
                                        )}
                                        <p className="text-[9px] opacity-50 mt-1.5 text-right">
                                            {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-primary border border-border/30">
                                            {userName.slice(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Loading indicator */}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5 justify-start">
                                    <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="bg-secondary/60 border border-border/30 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                                        {[0, 1, 2].map(i => (
                                            <motion.div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-primary"
                                                animate={{ y: ["0%", "-50%", "0%"] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                                    {error}
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick prompts — show only when minimal messages */}
                        {messages.length <= 1 && !loading && (
                            <div className="px-3 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
                                {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                                    <button
                                        key={label}
                                        onClick={() => sendMessage(prompt)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-medium border border-border/50 bg-secondary/30 hover:bg-primary/15 hover:border-primary/40 hover:text-primary transition-all text-muted-foreground"
                                    >
                                        <Icon className="w-3 h-3" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-3 border-t border-border/40 flex-shrink-0">
                            <div className="flex items-end gap-2 bg-secondary/40 border border-border/40 rounded-xl px-3 py-2 focus-within:border-primary/50 transition-colors">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything about your habits..."
                                    rows={1}
                                    className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60 max-h-24 leading-relaxed"
                                    style={{ fieldSizing: "content" } as any}
                                />
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim() || loading}
                                    className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex-shrink-0"
                                >
                                    {loading
                                        ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                        : <Send className="w-3.5 h-3.5 text-white" />
                                    }
                                </button>
                            </div>
                            <p className="text-[9px] text-muted-foreground text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistant;
