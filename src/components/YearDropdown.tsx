import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { YEAR_OPTIONS } from "@/hooks/achievementConstants";
import { CheckCircle } from "lucide-react";

export const YearDropdown = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = YEAR_OPTIONS.find((o) => o.value === value) || YEAR_OPTIONS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-xs bg-secondary/60 border border-border/50 rounded-lg px-3 py-1.5 text-foreground hover:border-primary/50 hover:bg-secondary/80 transition-all focus:outline-none"
      >
        <span>{selected.emoji}</span>
        <span className="font-medium">{selected.label}</span>
        <svg className={`w-3 h-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 z-50 min-w-[220px] rounded-xl border border-border/60 bg-[hsl(var(--card))] shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden"
          >
            {YEAR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left transition-colors ${value === opt.value
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-foreground hover:bg-secondary/60"
                  }`}
              >
                <span className="text-base">{opt.emoji}</span>
                <span>{opt.label}</span>
                {value === opt.value && (
                  <CheckCircle className="w-3 h-3 ml-auto text-primary" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
