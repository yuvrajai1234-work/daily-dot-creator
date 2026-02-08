import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
}

const AppSidebar = ({ isCollapsed, setIsCollapsed }: AppSidebarProps) => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate("/");
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col border-r border-sidebar-border transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      style={{ background: "hsl(var(--sidebar-background))" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        {!isCollapsed && (
          <h1 className="text-xl font-bold gradient-hero bg-clip-text text-transparent">
            DailyDots
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
        >
          {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* User avatar */}
      <div className={`px-4 py-4 border-b border-sidebar-border ${isCollapsed ? "flex justify-center" : ""}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
          <Avatar className="h-9 w-9 border-2 border-primary/30">
            <AvatarFallback className="bg-primary/20 text-primary text-sm">U</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">User</p>
              <p className="text-xs text-muted-foreground truncate">user@example.com</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {navLinks.map((link) => (
          <Tooltip key={link.to} delayDuration={0}>
            <TooltipTrigger asChild>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-smooth ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-primary-glow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  } ${isCollapsed ? "justify-center" : ""}`
                }
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{link.label}</span>}
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

      {/* Sign out */}
      <div className="px-2 py-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={`w-full text-sidebar-foreground hover:bg-sidebar-accent ${
            isCollapsed ? "justify-center px-0" : "justify-start"
          }`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
