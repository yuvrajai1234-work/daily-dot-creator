import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { LevelUpOverlay } from "@/components/LevelUpOverlay";
import { useLevelInfo, useProfileRealtimeSync } from "@/hooks/useXP";
import { AnimatePresence } from "framer-motion";
import AIAssistant from "@/components/AIAssistant";
import { NotificationWatcher } from "@/components/NotificationWatcher";
import { Onboarding } from "@/components/Onboarding";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Real-time synchronization
  useProfileRealtimeSync();

  const { data: levelInfo } = useLevelInfo();
  const currentLevel = levelInfo?.level;
  const [prevLevel, setPrevLevel] = useState<number | undefined>(undefined);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Track level changes
  useEffect(() => {
    if (currentLevel === undefined) return;

    if (prevLevel !== undefined && currentLevel > prevLevel) {
      setShowLevelUp(true);
    }

    setPrevLevel(currentLevel);
  }, [currentLevel, prevLevel]);

  const isCommunity = location.pathname === '/community';

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground relative">
      <NotificationWatcher />
      <AnimatePresence>
        {showLevelUp && currentLevel && (
          <LevelUpOverlay
            key="level-up-overlay"
            newLevel={currentLevel}
            onClose={() => setShowLevelUp(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar: Works as sticky on md+, drawer on mobile ── */}
      <AppSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* ── Main content area ── */}
      {/* On mobile: no left margin (sidebar is hidden). On desktop: margin matches sidebar */}
      <main
        className={`flex-1 flex flex-col transition-all duration-300 h-full overflow-hidden
          ${isCollapsed ? "md:ml-16" : "md:ml-64"}
          ml-0
        `}
      >
        <TopBar onMenuClick={() => setIsMobileSidebarOpen(true)} />

        {/* Content Area */}
        <div
          className={`flex-1 w-full
            ${isCommunity
              ? 'h-full overflow-hidden p-0'
              : 'overflow-y-auto p-3 md:p-6 max-w-7xl mx-auto'
            }
          `}
        >
          <Outlet />
        </div>
      </main>

      {/* ── AI Assistant floating button ── */}
      <AIAssistant />
      {/* ── Onboarding tour ── */}
      <Onboarding />
    </div>
  );
};

export default MainLayout;
