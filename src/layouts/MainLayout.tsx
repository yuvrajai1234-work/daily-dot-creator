import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { useRewardNotifications } from "@/hooks/useRewardNotifications";
import { useReminderToasts } from "@/hooks/useReminderToasts";
import { LevelUpOverlay } from "@/components/LevelUpOverlay";
import { useLevelInfo, useProfileRealtimeSync } from "@/hooks/useXP";
import { AnimatePresence } from "framer-motion";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Real-time synchronization
  useProfileRealtimeSync();

  const { data: levelInfo } = useLevelInfo();
  const currentLevel = levelInfo?.level;
  const [prevLevel, setPrevLevel] = useState<number | undefined>(undefined);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Monitor for claimable rewards and send notifications
  useRewardNotifications();
  // Monitor reminders
  useReminderToasts();

  // Track level changes
  useEffect(() => {
    if (currentLevel === undefined) return;

    if (prevLevel !== undefined && currentLevel > prevLevel) {
      setShowLevelUp(true);
      // Optional: Play sound here
    }

    setPrevLevel(currentLevel);
  }, [currentLevel, prevLevel]);

  return (
    <div className="flex min-h-screen relative">
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
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"
          }`}
      >
        <TopBar />
        <div className="p-6 max-w-7xl mx-auto flex-1 w-full overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
