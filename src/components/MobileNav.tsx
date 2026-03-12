import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import AvatarWithFrame from "@/components/AvatarWithFrame";
import {
  LayoutDashboard,
  Calendar,
  Trophy,
  Book,
  MoreHorizontal,
  User,
  LineChart,
  Users,
  Bell,
  CircleDollarSign,
  Gift,
  BookOpen,
  Info,
  Settings,
  LogOut,
  X,
} from "lucide-react";

// Primary tabs shown in the bottom bar (max 5)
const primaryNav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/achievements", label: "Badges", icon: Trophy },
  { to: "/journal", label: "Journal", icon: Book },
];

// Secondary items in the "More" sheet
const moreNav = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/community", label: "Community", icon: Users },
  { to: "/inbox", label: "Inbox", icon: Bell },
  { to: "/earn-coins", label: "Earn Coins", icon: CircleDollarSign },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/ebooks", label: "E-books", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About Us", icon: Info },
];

const MobileNav = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings } = useTheme();
  const dark = settings.darkMode;
  const [showMore, setShowMore] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url || "";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = userName.slice(0, 2).toUpperCase();

  const bg = dark ? "#0d0d12" : "#ffffff";
  const borderColor = dark ? "#1e1e2e" : "#e2e8f0";
  const textMuted = dark ? "#94a3b8" : "#64748b";
  const sheetBg = dark ? "#0d0d12" : "#ffffff";

  const handleSignOut = async () => {
    setShowMore(false);
    await signOut();
    navigate("/");
  };

  return (
    <>
      {/* ── Overlay backdrop ── */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* ── More Sheet ── */}
      <div
        style={{
          background: sheetBg,
          borderColor,
          transform: showMore ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
        className="fixed bottom-[64px] left-0 right-0 z-50 border-t rounded-t-2xl shadow-2xl md:hidden"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            style={{ background: borderColor }}
            className="w-10 h-1 rounded-full"
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <AvatarWithFrame
              avatarUrl={avatarUrl}
              fallback={initials}
              frameId={settings.avatarFrame}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p style={{ color: dark ? "#f1f5f9" : "#0f172a" }} className="text-sm font-semibold truncate">
                {userName}
              </p>
              <p style={{ color: textMuted }} className="text-xs truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMore(false)}
            style={{ color: textMuted }}
            className="p-2 rounded-full hover:bg-secondary/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid of links */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {moreNav.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setShowMore(false)}
            >
              {({ isActive }) => (
                <div
                  style={{
                    background: isActive ? "hsl(var(--primary)/0.12)" : "transparent",
                    color: isActive ? "hsl(var(--primary))" : textMuted,
                    borderColor: isActive ? "hsl(var(--primary)/0.3)" : "transparent",
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95"
                >
                  <link.icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium text-center leading-tight">
                    {link.label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>

        {/* Sign Out */}
        <div style={{ borderTopColor: borderColor }} className="border-t px-4 py-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Bottom Nav Bar ── */}
      <nav
        style={{ background: bg, borderTopColor: borderColor }}
        className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t flex items-center md:hidden safe-area-bottom"
      >
        {/* Primary nav items */}
        {primaryNav.map((link) => (
          <NavLink key={link.to} to={link.to} className="flex-1">
            {({ isActive }) => (
              <div
                style={{ color: isActive ? "hsl(var(--primary))" : textMuted }}
                className="flex flex-col items-center gap-1 py-1 transition-colors active:scale-90"
              >
                <div
                  style={{
                    background: isActive ? "hsl(var(--primary)/0.12)" : "transparent",
                  }}
                  className="p-1.5 rounded-xl transition-all"
                >
                  <link.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{link.label}</span>
              </div>
            )}
          </NavLink>
        ))}

        {/* More button */}
        <button
          onClick={() => setShowMore((v) => !v)}
          className="flex-1 flex flex-col items-center gap-1 py-1"
          style={{ color: showMore ? "hsl(var(--primary))" : textMuted }}
        >
          <div
            style={{
              background: showMore ? "hsl(var(--primary)/0.12)" : "transparent",
            }}
            className="p-1.5 rounded-xl transition-all"
          >
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
};

export default MobileNav;
