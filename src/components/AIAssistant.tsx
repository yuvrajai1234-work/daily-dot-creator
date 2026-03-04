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

// ─── Build comprehensive system prompt ─────────────────────────────────────────
const MBTI_DESCRIPTIONS: Record<string, string> = {
    ISTJ: "The Inspector — Responsible, sincere, analytical, reserved, realistic, systematic. Hardworking and trustworthy with practical judgment. Values duty, loyalty, and tradition.",
    ISFJ: "The Protector — Warm, considerate, gentle, responsible, pragmatic, thorough. Devoted caretakers who enjoy being helpful to others. Quietly caring and supportive.",
    INFJ: "The Counselor — Idealistic, organized, insightful, dependable, compassionate, gentle. Seek meaning and connection. Deeply empathetic visionaries.",
    INTJ: "The Mastermind — Innovative, independent, strategic, logical, reserved, insightful. Driven by original ideas. Natural systems thinkers and architects.",
    ISTP: "The Craftsman — Action-oriented, logical, analytical, spontaneous, reserved. Enjoy adventure, skilled at understanding how things work. Cool problem-solvers.",
    ISFP: "The Composer — Gentle, sensitive, nurturing, helpful, flexible, realistic. Appreciate beauty, deeply loyal to values, live in the present.",
    INFP: "The Healer — Sensitive, creative, idealistic, perceptive, caring, loyal. Driven by personal values and deep empathy. Dream big and value authenticity.",
    INTP: "The Architect — Intellectual, logical, precise, reserved, flexible, imaginative. Thinkers who enjoy speculation and creative problem-solving. Love theories.",
    ESTP: "The Dynamo — Outgoing, realistic, action-oriented, curious, versatile, spontaneous. Pragmatic problem solvers who thrive on energy and opportunity.",
    ESFP: "The Performer — Playful, enthusiastic, friendly, spontaneous, tactful. Have common sense, enjoy helping people, love being the center of fun.",
    ENFP: "The Champion — Enthusiastic, creative, spontaneous, optimistic, supportive. Inspired by new ideas, see potential everywhere, deeply people-oriented.",
    ENTP: "The Visionary — Inventive, enthusiastic, strategic, enterprising, inquisitive. Love new ideas and challenges, value inspiration, natural devil's advocates.",
    ESTJ: "The Supervisor — Efficient, outgoing, analytical, systematic, dependable. Like to run the show and get things done in an orderly, decisive fashion.",
    ESFJ: "The Provider — Friendly, outgoing, reliable, conscientious, organized. Helpful people-pleasers who enjoy being active, social and productive.",
    ENFJ: "The Teacher — Caring, enthusiastic, idealistic, organized, diplomatic. Skilled communicators who value deep connections and inspiring others.",
    ENTJ: "The Commander — Strategic, logical, efficient, outgoing, ambitious, independent. Natural-born leaders and effective organizers of people and long-term plans.",
};

const buildSystemPrompt = (ctx: {
    profile: any; habits: any[]; todayCompletions: any[];
    allCompletions: any[]; reflections: any[]; stats: any;
    levelInfo: any; achievements: any[]; userAchievements: any[];
    userName: string;
}) => {
    const { profile, habits, todayCompletions, allCompletions, reflections,
        stats, levelInfo, achievements, userAchievements, userName } = ctx;

    const p = profile as any;

    // ── Habit stats ───────────────────────────────────────────────────────────
    const active = habits.filter(h => !h.is_archived);
    const doneIds = new Set(todayCompletions.map(c => c.habit_id));
    const doneCnt = active.filter(h => doneIds.has(h.id)).length;
    const pending = active.filter(h => !doneIds.has(h.id)).map(h => h.name).slice(0, 5);
    const pct = active.length ? Math.round(doneCnt / active.length * 100) : 0;

    const cntMap: Record<string, number> = {};
    allCompletions.forEach(c => { cntMap[c.habit_id] = (cntMap[c.habit_id] || 0) + 1; });

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
    const locked = achievements.filter(a => !unlockedIds.has(a.id)).slice(0, 6);

    // ── Physical stats ────────────────────────────────────────────────────────
    const heightCm = p?.height_cm || p?.height;
    const weightKg = p?.weight_kg || p?.weight;
    const bmi = heightCm && weightKg
        ? (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1)
        : null;
    const bmiCategory = bmi
        ? Number(bmi) < 18.5 ? "Underweight"
            : Number(bmi) < 25 ? "Normal weight"
                : Number(bmi) < 30 ? "Overweight"
                    : "Obese"
        : null;

    // ── Personality ───────────────────────────────────────────────────────────
    const mbtiType = p?.personality_type || null;
    const mbtiDesc = mbtiType ? MBTI_DESCRIPTIONS[mbtiType] : null;
    const traits: string[] = p?.personality_traits || [];
    const archetype = p?.archetype || null;

    // Spectrum slider values (0-100)
    const introExtro = p?.introvertExtrovert ?? null;
    const analyticCreative = p?.analyticalCreative ?? null;
    const loyalFickle = p?.loyalFickle ?? null;
    const passiveActive = p?.passiveActive ?? null;

    const spectrumLines = [
        introExtro !== null ? `Introvert↔Extrovert: ${introExtro}/100 (${introExtro < 40 ? 'more Introverted' : introExtro > 60 ? 'more Extroverted' : 'Ambivert'})` : null,
        analyticCreative !== null ? `Analytical↔Creative: ${analyticCreative}/100 (${analyticCreative < 40 ? 'more Analytical' : analyticCreative > 60 ? 'more Creative' : 'Balanced'})` : null,
        loyalFickle !== null ? `Loyal↔Fickle: ${loyalFickle}/100 (${loyalFickle < 40 ? 'very Loyal' : loyalFickle > 60 ? 'more Fickle' : 'Balanced'})` : null,
        passiveActive !== null ? `Passive↔Active: ${passiveActive}/100 (${passiveActive < 40 ? 'more Passive' : passiveActive > 60 ? 'more Active' : 'Balanced'})` : null,
    ].filter(Boolean).join('\n');

    // ── Habits ────────────────────────────────────────────────────────────────
    const habitLines = active.slice(0, 10).map(h =>
        `${h.icon}${h.name}:${doneIds.has(h.id) ? 'done' : 'pending'},total=${cntMap[h.id] || 0}`
    ).join('; ');

    const reflSnippet = reflections.slice(0, 2).map(r =>
        `[${r.reflection_date}]${r.content?.slice(0, 80) ?? ''}`
    ).join(' | ');

    const nextAch = locked.slice(0, 4).map(a =>
        `${a.name}(need ${a.requirement_value} ${a.requirement_type})`
    ).join(', ');

    return `You are DailyDots AI Coach for ${userName}. Be warm, insightful, specific. Use their real data. Keep answers concise with bullet points where helpful.

═══ APP KNOWLEDGE (answer any "where do I..." or "how do I..." questions) ═══
DailyDots is a comprehensive self-improvement app with the following pages and features:

📊 DASHBOARD (/dashboard) — Daily habit overview, today's completions, current streak, XP progress, cycle stats (28-day cycles from account creation date), mood tracker, motivation score.

👤 PROFILE (/profile) — Update name, bio, avatar, designation, location. Set physical stats: weight (kg), height (cm) → BMI auto-calculates. Choose body type, relationship status, archetype. Set personality spectrum sliders (Introvert↔Extrovert, Analytical↔Creative, Loyal↔Fickle, Passive↔Active) → auto-generates MBTI type. Pick personality traits from a curated list.
  → To update BMI: go to Profile page → click Edit → enter your weight and height → BMI auto-calculates → Save.

📅 CALENDAR (/calendar) — Visual habit completion history. Days highlighted by intensity (Easy/Moderate/Solid/Intense). Add reminders with time, date, and mark as special events. Special events show on calendar with red ring.

🏆 ACHIEVEMENTS (/achievements) — 100+ achievements across 5 years, organized by category (beginner, intermediate, advanced, streak, habits, reflection, level, community, consistency, milestone, elite). Filter by rarity (Common/Rare/Epic/Legendary). Claim A Coins when achievements unlock.

📈 ANALYTICS (/analytics) — Habit performance charts, cycle-based stats, improvement percentages week-over-week, completion rates, best/worst habits. Permanently delete archived habits from here.

📓 JOURNAL (/journal) — Daily reflections/journaling. Write entries, track mood. Journals count toward reflection achievements.

👥 COMMUNITY (/community) — Community posts, leaderboard, friends list. Post updates, interact with other users.

📬 INBOX (/inbox) — Notifications, messages from the community.

💰 EARN COINS (/earn-coins) — Ways to earn B Coins through activity.

🎁 REWARDS (/rewards) — Spend A Coins on themes, badges, power-ups (Streak Shield, Double XP), avatar frames, sounds, premium content, coach sessions.

📚 E-BOOKS (/ebooks) — Self-improvement e-book library.

⚙️ SETTINGS (/settings) — Appearance (themes, dark/light mode), accessibility (reduced motion, compact mode, high contrast, font size), account management.

COIN SYSTEM:
• A Coins (Achievement coins) — earned by claiming achievements. Spent in Rewards shop.
• B Coins (Activity coins) — earned by completing habits daily. Used for in-app spending.
• P Coins (Premium coins) — premium currency.

HABIT SYSTEM: Habits have effort levels 1-4 (Easy/Moderate/Solid/Intense). 28-day cycles track performance. Habits can be archived (soft-delete) or permanently deleted from Analytics page only.

MBTI PERSONALITY TYPES (all 16):
${Object.entries(MBTI_DESCRIPTIONS).map(([t, d]) => `${t}: ${d}`).join('\n')}

═══ USER DATA (${new Date().toLocaleDateString('en-IN')}) ═══
Name: ${userName} | Email: ${p?.email || 'unknown'}
Level ${levelInfo?.level ?? '?'} | XP ${levelInfo?.totalXP ?? 0} (${levelInfo?.progress ?? 0}% to next)
Streak: ${stats?.currentStreak ?? 0}d current, ${stats?.bestStreak ?? 0}d best | Active ${stats?.daysActive ?? 0}d
Coins: A=${p?.a_coin_balance ?? 0} B=${p?.b_coin_balance ?? 0} P=${p?.p_coin_balance ?? 0}
Completions: ${stats?.totalCompletions ?? 0} total | Journals: ${stats?.totalReflections ?? 0}
Achievements: ${unlockedIds.size}/${achievements.length} unlocked

PHYSICAL PROFILE:
Age: ${p?.age || 'not set'} | Gender: ${p?.gender || 'not set'} | Location: ${p?.location || 'not set'}
Weight: ${weightKg ? `${weightKg}kg` : 'not set'} | Height: ${heightCm ? `${heightCm}cm` : 'not set'}
BMI: ${bmi ? `${bmi} (${bmiCategory})` : 'not set — user needs to enter weight and height on Profile page'}
Body Type: ${p?.body_type || p?.bodyType || 'not set'} | Status: ${p?.status || 'not set'}
Archetype: ${archetype || 'not set'} | Designation: ${p?.designation || 'not set'}

PERSONALITY:
MBTI Type: ${mbtiType || 'not set'}${mbtiDesc ? ` — ${mbtiDesc}` : ''}
Personality Spectrum:
${spectrumLines || 'Not configured yet (user can set on Profile page → Personality Spectrum section)'}
Selected Traits: ${traits.length > 0 ? traits.join(', ') : 'none selected yet'}

HABITS TODAY: ${doneCnt}/${active.length} done (${pct}%)${pending.length ? `, pending: ${pending.join(', ')}` : ' — all done!'}
All habits: ${habitLines || 'none yet'}
Recent journal: ${reflSnippet || 'none'}
Next achievements: ${nextAch || 'all done!'}

Rules: Always cite real data. If a field is "not set", tell the user HOW to set it (which page/section). Reference habits by name. Know MBTI types deeply.`;
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
