import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import AvatarWithFrame from "@/components/AvatarWithFrame";
import {
  ChevronsLeft,
  ChevronsRight,
  User,
  Calendar,
  Trophy,
  LineChart,
  Book,
  Users,
  Bell,
  CircleDollarSign,
  Gift,
  BookOpen,
  Info,
  LogOut,
  LayoutDashboard,
  Settings,
  X,
  Target,
} from "lucide-react";
import { useLevelInfo, getLevelTier } from "@/hooks/useXP";

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/achievements", label: "Achievements", icon: Trophy },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/journal", label: "Journal", icon: Book },
  { to: "/community", label: "Community", icon: Users },
  { to: "/inbox", label: "Inbox", icon: Bell },
  { to: "/earn-coins", label: "Earn Coins", icon: CircleDollarSign },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/ebooks", label: "E-books", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About Us", icon: Info },
];

interface AppSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

const AppSidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: AppSidebarProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings } = useTheme();
  const dark = settings.darkMode;

  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const initials = userName.slice(0, 2).toUpperCase();

  const { data: levelInfo } = useLevelInfo();
  const levelTier = levelInfo ? getLevelTier(levelInfo.level) : null;

  const handleSignOut = async () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
    await signOut();
    navigate("/");
  };

  const handleLinkClick = () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  // ── Palette driven by dark/light ──────────────────────────────────────────
  const sidebarBg = dark ? "#0d0d12" : "#ffffff";
  const borderColor = dark ? "#1e1e2e" : "#e2e8f0";
  const textPrimary = dark ? "#f1f5f9" : "#0f172a";   // nearly white / nearly black
  const textMuted = dark ? "#94a3b8" : "#475569";
  const hoverBg = dark ? "#1e1e2e" : "#f1f5f9";

  return (
    <>
      {/* ── Mobile Overlay ── */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen?.(false)}
        />
      )}

      <aside
        style={{ 
          background: sidebarBg, 
          borderRightColor: borderColor,
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 20px)"
        }}
        className={`fixed left-0 z-50 flex flex-col border-r transition-transform duration-300
          ${isCollapsed ? "md:w-16" : "md:w-64"}
          w-64 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          md:top-0 md:h-screen
          top-[52px] h-[calc(100dvh-52px)]
        `}
      >
      {/* ── Logo ── */}
      <div
        style={{ borderBottomColor: borderColor }}
        className="flex items-center justify-between px-4 py-5 border-b"
      >
        {!isCollapsed && (
          <h1 className="text-xl font-bold gradient-hero bg-clip-text text-transparent">
            DailyDots
          </h1>
        )}
        {/* Desktop collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ color: textPrimary }}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-70"
        >
          {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen?.(false)}
          style={{ color: textPrimary }}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-70"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── User ── */}
      <div
        style={{ borderBottomColor: borderColor }}
        className={`px-4 py-4 border-b ${isCollapsed ? "flex justify-center" : ""}`}
      >
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
          <AvatarWithFrame
            avatarUrl={avatarUrl}
            fallback={initials}
            frameId={settings.avatarFrame}
            size="sm"
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p style={{ color: textPrimary }} className="text-sm font-semibold truncate">{userName}</p>
              <p style={{ color: textMuted }} className="text-xs truncate">{userEmail}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 custom-scrollbar scroll-smooth">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            data-onboarding={`nav-${link.to.replace('/', '')}`}
            onMouseEnter={() => setHoveredLink(link.to)}
            onMouseLeave={() => setHoveredLink(null)}
            onClick={handleLinkClick}
          >
            {({ isActive }) => (
              <span
                style={{
                  background: isActive
                    ? "hsl(var(--primary))"
                    : hoveredLink === link.to
                      ? hoverBg
                      : "transparent",
                  color: isActive ? "#ffffff" : textPrimary,
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.96] hover:translate-x-1"
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1">{link.label}</span>}
              </span>
            )}
          </NavLink>
        ))}

        {/* ── Progress Card to fill space on mobile ── */}
        {!isCollapsed && levelInfo && (
          <div className="mt-6 px-2 mb-4">
            <div 
              style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
              className="rounded-2xl p-4 border border-dashed border-primary/20"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Target className="w-4 h-4" />
                  </div>
                  <span style={{ color: textPrimary }} className="text-xs font-bold uppercase tracking-wider">
                    {levelTier?.name || "Novice"}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  Lv. {levelInfo.level}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]" style={{ color: textMuted }}>
                  <span>Progress to Next Level</span>
                  <span>{Math.round(levelInfo.progress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] mt-1 opacity-90" style={{ color: textMuted }}>
                  <span>Total Progress</span>
                  <span className="font-bold text-primary">{levelInfo.totalXP.toLocaleString()} XP</span>
                </div>
                <p className="text-[9px] leading-tight mt-2 opacity-60 italic" style={{ color: textMuted }}>
                  Keep logging habits to unlock more features!
                </p>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Sign Out ── */}
      <div
        style={{ 
          borderTopColor: borderColor,
        }}
        className="px-4 py-4 md:py-4 border-t flex-shrink-0"
      >
        <button
          onClick={handleSignOut}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = dark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)";
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
          style={{ 
            color: dark ? "#f87171" : "#ef4444", 
            background: "transparent",
            borderColor: "transparent"
          }}
          className={`w-full flex items-center rounded-xl p-3 text-sm font-semibold transition-all duration-200 border
            ${isCollapsed ? "justify-center" : "justify-start gap-3"}
            active:scale-95
          `}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
    </>
  );
};

export default AppSidebar;
