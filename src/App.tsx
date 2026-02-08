import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import CalendarPage from "./pages/Calendar";
import Achievements from "./pages/Achievements";
import Analytics from "./pages/Analytics";
import JournalPage from "./pages/JournalPage";
import Community from "./pages/Community";
import Inbox from "./pages/Inbox";
import EarnCoins from "./pages/EarnCoins";
import Rewards from "./pages/Rewards";
import Ebooks from "./pages/Ebooks";
import Settings from "./pages/Settings";
import About from "./pages/About";
import MainLayout from "./layouts/MainLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/community" element={<Community />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/earn-coins" element={<EarnCoins />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/ebooks" element={<Ebooks />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
