import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { LevelUpOverlay } from "@/components/LevelUpOverlay";
import { useLevelInfo, useProfileRealtimeSync } from "@/hooks/useXP";
import { AnimatePresence } from "framer-motion";
import AIAssistant from "@/components/AIAssistant";
import { NotificationWatcher } from "@/components/NotificationWatcher";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
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

      <AppSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 flex flex-col transition-all duration-300 h-full overflow-hidden ${isCollapsed ? "ml-16" : "ml-64"
          }`}
      >
        <TopBar />
        {/* Content Area */}
        {/* If community page: remove padding/margin and hide overflow (inner components handle scroll) */}
        {/* If other page: use standard padding and allow vertical scroll */}
        <div className={`flex-1 w-full ${location.pathname === '/community' ? 'h-full overflow-hidden p-0' : 'overflow-y-auto p-6 max-w-7xl mx-auto'}`}>
          <Outlet />
        </div>
      </main>
      <AIAssistant />
    </div>
  );
};

export default MainLayout;
