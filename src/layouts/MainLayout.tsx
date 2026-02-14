import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { useRewardNotifications } from "@/hooks/useRewardNotifications";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Monitor for claimable rewards and send notifications
  useRewardNotifications();

  return (
    <div className="flex min-h-screen">
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
