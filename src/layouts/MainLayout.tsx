import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <AppSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <TopBar />
        <div className="p-6 max-w-7xl mx-auto flex-1 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
