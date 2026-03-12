import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
} from "lucide-react";

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
        style={{ background: sidebarBg, borderRightColor: borderColor }}
        className={`fixed left-0 top-0 h-screen z-50 flex flex-col border-r transition-transform duration-300 md:translate-x-0 ${
          isCollapsed ? "md:w-16" : "md:w-64"
        } w-64 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
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
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navLinks.map((link) => (
          <Tooltip key={link.to} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={link.to}
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
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer"
                  >
                    <link.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{link.label}</span>}
                  </span>
                )}
              </NavLink>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="bg-popover border-border">
                {link.label}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>

      {/* ── Sign Out ── */}
      <div
        style={{ borderTopColor: borderColor }}
        className="px-2 py-4 border-t"
      >
        <button
          onClick={handleSignOut}
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          style={{ color: textPrimary, background: "transparent" }}
          className={`w-full flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isCollapsed ? "justify-center" : "justify-start gap-3"
            }`}
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
