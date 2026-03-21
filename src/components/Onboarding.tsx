import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, X, Sparkles, Star, MessageCircle,
  Target, Plus, Coins, ShoppingBag, Zap, Archive, RotateCcw,
  BookOpen, CheckCircle2,
} from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { useHabits } from "@/hooks/useHabits";
import { useProfile } from "@/hooks/useProfile";
import { useLevelInfo } from "@/hooks/useXP";

/* ── Spotlight — direct DOM update via RAF (no React state, no batching lag) ── */
const Spotlight = ({ selector, padding = 12, round = false }: { selector: string | null; padding?: number; round?: boolean }) => {
  if (!selector) return null;
  const ref = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (selector) {
      setIsMoving(true);
      const t = setTimeout(() => setIsMoving(false), 300);
      return () => clearTimeout(t);
    }
  }, [selector]);

  useEffect(() => {
    const tick = () => {
      const el = selector ? document.querySelector<HTMLElement>(selector) : null;
      if (ref.current && backdropRef.current) {
        if (el) {
          const r = el.getBoundingClientRect();
          const l = r.left - padding;
          const t = r.top - padding;
          const w = r.width + padding * 2;
          const h = r.height + padding * 2;
          const rEdge = l + w;
          const bEdge = t + h;

          ref.current.style.left   = `${l}px`;
          ref.current.style.top    = `${t}px`;
          ref.current.style.width  = `${w}px`;
          ref.current.style.height = `${h}px`;
          ref.current.style.opacity = "1";

          backdropRef.current.style.clipPath = `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${l}px ${t}px, ${l}px ${bEdge}px, ${rEdge}px ${bEdge}px, ${rEdge}px ${t}px, ${l}px ${t}px)`;
          backdropRef.current.style.opacity = "1";
        } else {
          ref.current.style.width = "0px";
          ref.current.style.height = "0px";
          ref.current.style.opacity = "0";
          backdropRef.current.style.opacity = "0";
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [selector, padding]);

  return (
    <>
      <div 
        ref={backdropRef}
        className={`fixed inset-0 z-[90] pointer-events-none bg-black/65 backdrop-blur-sm ${isMoving ? "transition-all duration-300" : "transition-opacity duration-300"}`}
        style={{ opacity: 0 }}
      />
      <div
        ref={ref}
        className={`fixed pointer-events-none z-[100] ${isMoving ? "transition-all duration-300" : ""}`}
        style={{ borderRadius: round ? "9999px" : 14, left: "50%", top: "50%", width: 0, height: 0, opacity: 0 }}
      >
        {selector && (
          <div className={`absolute inset-[-4px] ${round ? "rounded-full" : "rounded-[18px]"} border-2 border-violet-400
                          shadow-[0_0_28px_8px_rgba(139,92,246,0.65)] animate-pulse`} />
        )}
      </div>
    </>
  );
};

const AdonisBubble = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [display, setDisplay] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplay(""); setDone(false); let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => { i++; setDisplay(text.slice(0, i)); if (i >= text.length) { clearInterval(iv); setDone(true); } }, 18);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  return (
    <div className="flex items-start gap-3 w-full">
      <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity }}
        className="w-9 h-9 flex-shrink-0 rounded-full bg-white flex items-center justify-center shadow-lg border border-border/50 overflow-hidden">
        <img src="/adonis.png" alt="Adonis" className="w-full h-full object-cover" />
      </motion.div>
      <div className="bg-secondary/60 border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow w-full max-w-[calc(100%-48px)]">
        <span className="block text-[10px] font-bold text-violet-400 mb-1 uppercase tracking-widest">Adonis</span>
        <div className="relative text-sm leading-relaxed">
          {/* Invisible full text block to force parent height and width instantly */}
          <span className="invisible pointer-events-none select-none block">{text}</span>
          
          {/* Absolute typing overlay */}
          <p className="absolute top-0 left-0 w-full h-full text-foreground/90">
            {display}
            {!done && <span className="inline-block w-0.5 h-4 bg-primary/80 animate-pulse ml-0.5 align-middle" />}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Adonis floating panel (used in tour) ── */
const AdonisPanel = ({
  title, adonisText, cta, ctaVariant = "primary", onCta, onSkip,
  stepNum, totalSteps, hint, disabled, disabledMsg, selector
}: {
  title: string; adonisText: string; cta: string;
  ctaVariant?: "primary" | "success";
  onCta: () => void; onSkip: () => void;
  stepNum: number; totalSteps: number;
  hint?: string; disabled?: boolean; disabledMsg?: string;
  selector?: string | null;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (selector) {
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>(selector);
        if (el) {
          try {
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          } catch (e) {
            el.scrollIntoView();
          }
        }
      }, 50); // Small delay to let DOM settle if navigating
    }
  }, [selector]);

  useEffect(() => {
    const tick = () => {
      const el = selector ? document.querySelector<HTMLElement>(selector) : null;
      if (ref.current) {
        if (el) {
          const r = el.getBoundingClientRect();
          const winH = window.innerHeight;
          const winW = window.innerWidth;
          const panelH = ref.current.offsetHeight;
          const panelW = Math.min(384, winW - 24); // max-w-sm

          const elCenterX = r.left + r.width / 2;
          let left = elCenterX - panelW / 2;
          left = Math.max(12, Math.min(left, winW - panelW - 12));

          // Pin strictly below the target selector as requested
          let top = r.bottom + 20;

          ref.current.style.left = `${left}px`;
          ref.current.style.top = `${top}px`;
          ref.current.style.transform = "none";
          ref.current.style.bottom = "auto";
        } else {
          ref.current.style.left = "50%";
          ref.current.style.top = "auto";
          ref.current.style.bottom = "16px";
          ref.current.style.transform = "translateX(-50%)";
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [selector]);

  return (
    <motion.div
      ref={ref}
      data-onboarding-control="true"
      key={adonisText.slice(0, 20)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed z-[101] w-[calc(100vw-24px)] max-w-sm pointer-events-auto"
    >
      <div className="bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 flex-shrink-0" />
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md shadow-purple-500/40 overflow-hidden border border-border/50">
                <img src="/adonis.png" alt="Adonis" className="w-full h-full object-cover" />
              </motion.div>
              <div>
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Adonis · {title}</p>
                <p className="text-[10px] text-muted-foreground">Step {stepNum} of {totalSteps}</p>
              </div>
            </div>
            <button onClick={onSkip} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <AdonisBubble text={adonisText} delay={250} />

        {hint && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-xl px-3 py-2">
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            </motion.div>
            <p className="text-xs text-violet-300">{hint}</p>
          </motion.div>
        )}

        {disabled && disabledMsg && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
            <span className="text-base leading-none mt-0.5">⚠️</span>
            <p className="text-xs text-amber-400 leading-relaxed">{disabledMsg}</p>
          </motion.div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === stepNum ? "w-5 bg-violet-500" : i + 1 < stepNum ? "w-1.5 bg-violet-500/40" : "w-1.5 bg-border"
              }`} />
            ))}
          </div>
          <motion.button
            whileHover={disabled ? {} : { scale: 1.05 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
            onClick={disabled ? undefined : onCta}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold shadow-lg transition-all ${
              disabled
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                : ctaVariant === "success"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25 cursor-pointer"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-500/25 cursor-pointer"
            }`}>
            {cta} <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  </motion.div>
  );
};

/* ── DATA ── */
const INFO_SLIDES = [
  {
    icon: <Target className="w-10 h-10 text-white" />,
    from: "#7c3aed", to: "#4f46e5",
    title: "Welcome to DailyDots 🎯",
    sub: "Transform Your Daily Routines",
    body: "DailyDots combines habit tracking, AI insights, and gamification to help you build lasting routines. Whether breaking old habits or starting new ones — we have the tools you need.",
    bullets: ["📊 Track habits with effort levels 1–4", "🤖 AI-powered reflections & insights", "🎮 Earn coins, XP, and level up", "👥 Join communities & leaderboards"],
  },
  {
    icon: <Plus className="w-10 h-10 text-white" />,
    from: "#2563eb", to: "#7c3aed",
    title: "Create Habits ➕",
    sub: "Start Tracking in Two Taps",
    body: "Hit the + button to pick from 25+ presets (workout, meditation, reading…) or build a custom habit with your own emoji and color. Habits appear in a card grid on your dashboard.",
    bullets: ["🏃 25+ habit templates", "🎨 Custom emoji & color", "📈 Mini weekly chart per card", "⚙️ Archive or delete anytime"],
  },
  {
    icon: <Coins className="w-10 h-10 text-white" />,
    from: "#d97706", to: "#dc2626",
    title: "Earn Coins (Part 1)",
    sub: "Consistency is Multiplied",
    body: "Every habit log earns you B-Coins and XP. Streak multipliers scale rewards over the 4-week cycle. Max 28 points per habit per cycle week.",
    bullets: ["Week 1: 1× multiplier", "Week 2: 1.5× multiplier", "Week 3: 2× multiplier", "Week 4: 3× — Mastery tier!"],
  },
  {
    icon: <RotateCcw className="w-10 h-10 text-white" />,
    from: "#059669", to: "#0d9488",
    title: "B Coins Reset Weekly 🔄",
    sub: "Spend Smart — They Reset Every 7 Days",
    body: "B Coins are your weekly currency. They reset every 7 days based on your personal cycle start date, so you must use them within the week before they expire.",
    bullets: ["🔄 B Coins reset every cycle week", "📺 Watch ads: +10 B Coins each", "⚡ XP only from first 5 ads/day", "📺 After 5 ads: coins only, no XP"],
  },
  {
    icon: <Archive className="w-10 h-10 text-white" />,
    from: "#7c3aed", to: "#9333ea",
    title: "Archive vs Delete 📦",
    sub: "Know the Difference!",
    body: "Archiving (costs 50 B Coins) pauses the habit safely—removing it from your dashboard without penalizing your daily score or breaking its streak. Deleting (free) is permanent and securely wipes all history forever.",
    bullets: ["📦 Archive: 50 B Coins, streak is protected", "🗑️ Delete: Free, but permanent data wipe", "⋯ Archive via the Habit Card menu", "📈 Delete ONLY via your Analytics page"],
  },
  {
    icon: <BookOpen className="w-10 h-10 text-white" />,
    from: "#0ea5e9", to: "#7c3aed",
    title: "Explore All Pages 🗺️",
    sub: "Packed with Features",
    body: "DailyDots has a full ecosystem: Calendar, Achievements, Analytics, Journal, Community, Inbox, Earn Coins, Rewards, E-Books, and Settings — each serves a powerful purpose.",
    bullets: ["📅 Calendar: full habit history", "🏆 Achievements: badge milestones", "📊 Analytics: deep trend charts", "👥 Community: compete & grow"],
  },
  {
    icon: <ShoppingBag className="w-10 h-10 text-white" />,
    from: "#16a34a", to: "#059669",
    title: "The Rewards Shop 🎁",
    sub: "Coins → Real Value",
    body: "Redeem coins in the Rewards Shop for AI coaching sessions, exclusive e-books, partner discounts, and premium badges. Your discipline earns real-world rewards.",
    bullets: ["🤖 AI coaching sessions", "📚 Exclusive e-book library", "🏷️ Partner discounts", "🏅 Premium profile badges"],
  },
];

interface TourStep {
  page: string; selector: string | null; title: string; adonis: string;
  cta: string; ctaVariant?: "primary" | "success"; hint?: string;
  autoOnBtnClick?: boolean; autoOnHabits?: boolean;
}

const TOUR: TourStep[] = [
  {
    page: "/dashboard", selector: "[data-onboarding='add-habit-btn']",
    title: "Add Your First Habit",
    adonis: "This glowing button is your gateway! Go ahead and click Add New Habit — choose a preset from the list or create a custom one. I'll update my message the moment you click!",
    cta: "I clicked it!", hint: "👆 Click the glowing button above to open the creator",
    autoOnBtnClick: true,
  },
  {
    page: "/dashboard", selector: null,
    title: "Choose a Habit",
    adonis: "Now pick a habit from the presets — I'd suggest something simple like 🏃 Morning Run or 💧 Drink Water. Select it and hit Create Habit. I'll celebrate the moment you do! 🎉",
    cta: "Let's do it 🚀", autoOnHabits: true,
  },
  {
    page: "/dashboard", selector: "[data-onboarding='habits-grid'] > :first-child",
    title: "Your Habit Card",
    adonis: "Your first habit card! 🎊 Those 1 · 2 · 3 · 4 buttons are your daily effort levels. 1 = barely there, 4 = absolutely crushed it! Logging costs 15 B Coins but earns you XP.",
    cta: "Got it! →",
  },
  {
    page: "/dashboard", selector: "[data-onboarding='improvement-card']",
    title: "Improvement Tracker",
    adonis: "This card shows your weekly improvement % — current week vs last week, paced by days elapsed. Click it anytime for a full per-habit breakdown. This is your progress compass! 🧭",
    cta: "Next: Profile →",
  },
  {
    page: "/profile", selector: "[data-onboarding='profile-card']",
    title: "Your Profile Card",
    adonis: "Welcome to your profile! This is your public identity in DailyDots — your avatar, name, designation, and bio all live here. Let's fill it out!",
    cta: "Let's fill it in ✏️",
  },
  {
    page: "/profile", selector: "[data-onboarding='profile-edit-btn']",
    title: "Fill Your Profile & Details",
    adonis: "Click Edit ☝️ then fill in BOTH cards: the Profile card (Name, Designation, Bio, Location) AND the Details card below it (Age, Gender, Weight, Height, Archetype). Hit Save when done — all fields are required!",
    cta: "All done! ✅", hint: "Fill Profile card + Details card below → then hit Save",
    ctaVariant: "success",
  },
  {
    page: "/profile", selector: null,
    title: "Profile Complete!",
    adonis: "Incredible! 🙌 Your profile is fully set up. You'll now see your BMI, earned badges, habit stats, and at Level 5 you unlock your Personality Spectrum and Life Balance spider web. Keep climbing!",
    cta: "Next: Calendar →",
  },
  {
    page: "/calendar", selector: null,
    title: "Habit Calendar",
    adonis: "The Calendar shows your entire habit history at a glance. Each colored dot = a day you logged effort. Darker and bigger = more effort that day. Your visual proof of consistency! 📅",
    cta: "Next →",
  },
  {
    page: "/achievements", selector: null,
    title: "Achievements",
    adonis: "Achievements are your milestones! Complete streaks, hit coin totals, and reach habit goals to unlock badges. These badges display on your profile and inspire others in the Community. 🏆",
    cta: "Next →",
  },
  {
    page: "/analytics", selector: null,
    title: "Analytics",
    adonis: "Analytics is where your data comes alive! See weekly scores, progress charts, and habit-level trends. Understanding your patterns is the first step to mastering them. 📊",
    cta: "Next →",
  },
  {
    page: "/journal", selector: null,
    title: "Journal",
    adonis: "Your Journal is a daily reflection space. Write your wins, struggles, and mindset shifts. Journaling costs B Coins to save but earns XP — and clarity is priceless. ✍️",
    cta: "Next →",
  },
  {
    page: "/community", selector: null,
    title: "Community Hub",
    adonis: "Community connects you with others on the same journey! Join groups, compete on leaderboards, send friend invites, and keep each other accountable. You grow faster together. 👥",
    cta: "Next →",
  },
  {
    page: "/inbox", selector: null,
    title: "Inbox",
    adonis: "Inbox is your notification center. Community invites, challenge results, leaderboard updates — everything lands here. Check it daily so you never miss anything important. 🔔",
    cta: "Next →",
  },
  {
    page: "/earn-coins", selector: null,
    title: "Earn Coins",
    adonis: "The Earn Coins page is where you top up! Watch ads (+10 B Coins each, first 5 give XP too), complete daily quests, or buy P Coins via subscription. B Coins reset Mondays — spend wisely! 💰",
    cta: "Next →",
  },
  {
    page: "/rewards", selector: null,
    title: "Rewards Shop",
    adonis: "The Rewards Shop turns your coins into real value! Trade them for AI coaching sessions, exclusive e-books, partner discounts, and premium badges. Hard work pays off literally here! 🎁",
    cta: "Next →",
  },
  {
    page: "/ebooks", selector: null,
    title: "E-Books Library",
    adonis: "The E-Books library has curated reads on habits, mindset, health, and growth. Some are free, others cost coins. Knowledge is the ultimate habit — read something weekly! 📚",
    cta: "Next →",
  },
  {
    page: "/settings", selector: null,
    title: "Settings",
    adonis: "Last stop on the tour — Settings! Customize your theme, toggle dark mode, configure notifications, manage privacy, and make DailyDots feel entirely like home. ⚙️",
    cta: "That's a wrap! 🎉", ctaVariant: "success",
  },
];

type Phase = "slides" | "terms" | "adonis-entry" | "tour" | "goodbye";

export const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("slides");
  const [slideIdx, setSlideIdx] = useState(0);
  const [tourStep, setTourStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsBtn, setShowTermsBtn] = useState(false);

  const { data: habits = [] } = useHabits();
  const { data: profileData } = useProfile();
  const { data: levelInfo } = useLevelInfo();
  const prevHabitsLen = useRef(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("has_seen_onboarding").eq("user_id", user.id).single()
      .then(({ data, error }) => { if (!error && data && !data.has_seen_onboarding) setVisible(true); });
  }, [user]);

  useEffect(() => {
    if (phase !== "terms") return;
    const t = setTimeout(() => setShowTermsBtn(true), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "tour") return;
    const expected = TOUR[tourStep]?.page;
    if (expected && location.pathname !== expected) navigate(expected);
  }, [phase, tourStep, location.pathname, navigate]);

  useEffect(() => {
    if (phase !== "tour" || tourStep !== 0) return;
    const btn = document.querySelector("[data-onboarding='add-habit-btn']");
    if (!btn) return;
    const handler = () => setTimeout(() => setTourStep(1), 600);
    btn.addEventListener("click", handler, { once: true });
    return () => btn.removeEventListener("click", handler);
  }, [phase, tourStep]);

  useEffect(() => {
    if (phase !== "tour" || tourStep !== 1) return;
    if (habits.length > 0 && prevHabitsLen.current === 0) {
      setTimeout(() => setTourStep(2), 1200);
    }
    prevHabitsLen.current = habits.length;
  }, [habits.length, phase, tourStep]);

  const [isIntroMinimized, setIsIntroMinimized] = useState(false);
  const [domTick, setDomTick] = useState(0);

  const saveBtnWasShownRef = useRef(false);
  useEffect(() => { 
    saveBtnWasShownRef.current = false; 
    setIsIntroMinimized(false);
    const iv = setInterval(() => setDomTick(t => t + 1), 500);

    if (phase === "tour") {
      const cur = TOUR[tourStep];
      if (cur?.selector) {
        const el = document.querySelector(cur.selector);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    return () => clearInterval(iv);
  }, [tourStep, phase]);

  // Observer to auto-advance step 5 when the save button disappears
  useEffect(() => {
    if (phase === "tour" && tourStep === 5) {
      const saveBtnExists = !!document.querySelector("[data-onboarding='profile-save-btn']");
      if (saveBtnExists) {
        saveBtnWasShownRef.current = true;
      } else if (saveBtnWasShownRef.current) {
        saveBtnWasShownRef.current = false;
        advanceTour(); // Auto advance when saved
      }
    }
  }, [domTick, phase, tourStep]);

  const complete = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ has_seen_onboarding: true }).eq("user_id", user.id);
    setVisible(false);
  };

  const advanceTour = () => {
    const next = tourStep + 1;
    if (next >= TOUR.length) { setPhase("goodbye"); return; }
    setTourStep(next);
    const nextPage = TOUR[next].page;
    if (nextPage !== location.pathname) navigate(nextPage);
  };

  if (!visible) return null;
  const cur = TOUR[tourStep];

  return (
    <AnimatePresence mode="wait">

      {phase === "slides" && (
        <motion.div key="slides" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-background/85 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="w-[calc(100%)] max-w-lg bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-1.5 w-full transition-all duration-500 flex-shrink-0"
              style={{ background: `linear-gradient(90deg,${INFO_SLIDES[slideIdx].from},${INFO_SLIDES[slideIdx].to})` }} />

            <div className="p-5 md:p-6 space-y-4 flex flex-col overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                  style={{ background: `linear-gradient(135deg,${INFO_SLIDES[slideIdx].from},${INFO_SLIDES[slideIdx].to})` }}>
                  {INFO_SLIDES[slideIdx].icon}
                </div>
                <div>
                  <AnimatePresence mode="wait">
                    <motion.h2 key={slideIdx} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="text-lg font-bold">{INFO_SLIDES[slideIdx].title}</motion.h2>
                  </AnimatePresence>
                  <p className="text-xs text-muted-foreground">{INFO_SLIDES[slideIdx].sub}</p>
                </div>
                <span className="ml-auto text-xs text-muted-foreground bg-secondary/40 px-2 py-1 rounded-full">{slideIdx + 1}/{INFO_SLIDES.length}</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={`body-${slideIdx}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} 
                  className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                  <p className="text-sm text-muted-foreground leading-relaxed">{INFO_SLIDES[slideIdx].body}</p>
                  <div className="grid grid-cols-1 gap-1.5 pb-2">
                    {INFO_SLIDES[slideIdx].bullets.map((b) => (
                      <div key={b} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <p className="text-sm text-foreground/80">{b}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between pt-1 flex-shrink-0">
                <div className="flex gap-1.5">
                  {INFO_SLIDES.map((_, i) => (
                    <button key={i} onClick={() => setSlideIdx(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${slideIdx === i ? "w-6 bg-primary" : "w-2 bg-primary/20 hover:bg-primary/40"}`} />
                  ))}
                </div>
                <div className="flex gap-2">
                  {slideIdx > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSlideIdx(i => i - 1)} className="rounded-full h-10 px-4">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  )}
                  <Button onClick={() => { if (slideIdx < INFO_SLIDES.length - 1) setSlideIdx(i => i + 1); else setPhase("terms"); }}
                    className="rounded-full h-10 px-6 shadow-md font-bold transition-all hover:opacity-90 active:scale-95"
                    style={{ background: `linear-gradient(135deg,${INFO_SLIDES[slideIdx].from},${INFO_SLIDES[slideIdx].to})`, border: 0, color: "#fff" }}>
                    {slideIdx < INFO_SLIDES.length - 1 ? <><span>Next</span><ChevronRight className="w-4 h-4 ml-1" /></> : <><Sparkles className="w-4 h-4 mr-1" />Continue</>}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {phase === "terms" && (
        <motion.div key="terms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-background/90 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-indigo-500 flex-shrink-0" />
            <div className="p-5 space-y-4 flex flex-col overflow-hidden">
              <div className="text-center">
                <span className="text-3xl">📜</span>
                <h2 className="text-xl font-bold mt-2">Terms & Privacy</h2>
              </div>
              <div className="flex-1 overflow-y-auto rounded-2xl bg-secondary/20 border border-border/40 p-4 space-y-3 text-xs text-muted-foreground leading-relaxed custom-scrollbar">
                {[
                  ["Who We Are", "DailyDots is a personal habit-tracking and self-improvement platform designed to help you build lasting positive routines."],
                  ["What We Collect", "We collect your account information (email, display name), habit completion data, XP & coin balances, and any profile details you voluntarily provide."],
                  ["Your Privacy", "Your data is never sold to third parties. Community features only display your chosen display name and public profile. Journal entries are private by default."],
                  ["B Coins & Virtual Currency", "B Coins are virtual points with no monetary value and cannot be exchanged for cash. They reset weekly every Monday as part of the game design."],
                  ["Age Requirement", "You must be at least 13 years old to create an account and use DailyDots."],
                  ["Your Content", "You own your journal entries and profile content. By using DailyDots you grant us a license to display your public profile in community features."],
                  ["Changes", "We may update these terms with 7 days' notice via the app's Inbox. Continued use after notice constitutes acceptance."],
                  ["Contact", "Questions? Reach us via the About Us page in the sidebar."],
                ].map(([heading, text]) => (
                  <div key={heading}>
                    <p className="font-semibold text-foreground mb-0.5">{heading}</p>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
              <AnimatePresence>
                {showTermsBtn && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Button
                      onClick={() => { setTermsAccepted(true); setPhase("adonis-entry"); }}
                      className="w-full rounded-full py-5 font-bold text-base shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white border-0">
                      I Accept & Continue ✓
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}

      {phase === "adonis-entry" && (
        <motion.div key="adonis-entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 p-6 text-center w-full max-w-sm">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.3 }}
              className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-purple-500/60 border-4 border-white overflow-hidden flex-shrink-0">
              <img src="/adonis.png" alt="Adonis" className="w-full h-full object-cover" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Hi! I'm Adonis 👋</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                Your personal DailyDots guide. I'll walk you through every feature of this app step by step — with live highlights on the actual screen so you know exactly what to click.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
              className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <p className="text-xs text-white/80">I'll highlight every button as we go — just follow the glow!</p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPhase("tour")}
              className="w-full h-12 rounded-full bg-white text-violet-600 font-black text-lg shadow-xl shadow-white/10 flex items-center justify-center gap-2 hover:bg-white/90 transition-all">
              LET'S START! <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {phase === "tour" && (() => {
        const meta: any = profileData || {};
        const basicInfoFilled = !!(meta.full_name && meta.designation && meta.bio && meta.location);
        const detailsFilled = !!((meta.age || meta.weight || meta.height) && meta.gender && meta.archetype && (meta.personality_traits as string[])?.length > 0);
        const allProfileFilled = basicInfoFilled && detailsFilled;
        const isProfileFillStep = tourStep === 5;
        const saveBtnExists = !!document.querySelector("[data-onboarding='profile-save-btn']");
        if (saveBtnExists) saveBtnWasShownRef.current = true;
        const profileSaved = saveBtnWasShownRef.current && !saveBtnExists;

        const spotlightSel = isProfileFillStep
          ? profileSaved ? null : saveBtnExists ? "[data-onboarding='profile-left-col']" : cur?.selector ?? null
          : cur?.selector ?? null;

        const isDisabled = isProfileFillStep && profileSaved && !allProfileFilled;
        const disabledMsg = isDisabled ? "Please fill in all profile fields before continuing!" : undefined;
        const hintText = isProfileFillStep && profileSaved ? "Looking good! Click \"All done!\" 🎉" : isProfileFillStep && saveBtnExists ? "Now hit Save ☝️" : cur?.hint;
        const showMinimized = isIntroMinimized && !profileSaved;

        return (
          <motion.div key={`tour-${tourStep}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            
            <Spotlight selector={spotlightSel} />

            {showMinimized ? (
              <motion.button
                data-onboarding-control="true"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                onClick={() => setIsIntroMinimized(false)}
                className="fixed bottom-6 right-6 z-[120] flex items-center gap-2 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-full px-5 py-3 shadow-2xl border-2 border-white/20 hover:scale-105 transition-all pointer-events-auto">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold text-sm">Show Guide</span>
              </motion.button>
            ) : (
              <AdonisPanel
                title={cur?.title ?? ""} adonisText={cur?.adonis ?? ""}
                cta={isProfileFillStep && !profileSaved ? "Let's Edit ✏️" : (cur?.cta ?? "Next →")}
                ctaVariant={cur?.ctaVariant ?? "primary"} selector={spotlightSel}
                onCta={() => { 
                  if (tourStep === 1) setIsIntroMinimized(true);
                  else if (isProfileFillStep && !profileSaved) setIsIntroMinimized(true); 
                  else advanceTour(); 
                }}
                onSkip={() => setPhase("goodbye")} stepNum={tourStep + 1} totalSteps={TOUR.length}
                hint={hintText} disabled={isDisabled} disabledMsg={disabledMsg}
              />
            )}
          </motion.div>
        );
      })()}

      {phase === "goodbye" && (
        <motion.div key="goodbye" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md">
          <style>{`#ai-assistant-button { z-index: 101 !important; transition: z-index 0.3s ease; }`}</style>

          <motion.div initial={{ scale: 0.88, y: 20 }} animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="w-[calc(100vw-24px)] max-w-sm bg-card border-2 border-violet-400 shadow-[0_0_40px_rgba(139,92,246,0.4)] rounded-3xl overflow-hidden flex flex-col max-h-[90vh] relative z-[101] animate-pulse-subtle">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 flex-shrink-0" />
            <div className="p-6 flex flex-col overflow-hidden">
              <div className="flex flex-col items-center gap-3 pt-1 mb-4 flex-shrink-0">
                <motion.div animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-purple-500/40 border-4 border-white overflow-hidden flex-shrink-0">
                  <img src="/adonis.png" alt="Adonis" className="w-full h-full object-cover" />
                </motion.div>
                <div className="text-center">
                  <p className="font-bold text-lg">Adonis</p>
                  <p className="text-xs text-violet-400">Your DailyDots Guide</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                <AdonisBubble delay={300} text="You've completed the full tour! 🎉 You're officially ready to build amazing habits. I'm rooting for you every single day!" />
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                  className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4 text-center">
                  <Star className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-medium italic text-foreground/80">"Excellence is not an act but a habit."</p>
                  <p className="text-xs text-muted-foreground mt-1">— Aristotle</p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                  className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 space-y-2">
                  <p className="text-xs font-semibold text-violet-400 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> Where to find me</p>
                  <p className="text-xs text-muted-foreground">I live in the sparkle button in the bottom-right corner!</p>
                </motion.div>
              </div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="pt-4 flex-shrink-0">
                <Button onClick={complete} className="w-full rounded-full py-5 font-bold text-base shadow-lg bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white border-0">Start My Journey! 🚀</Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}

    </AnimatePresence>
  );
};
