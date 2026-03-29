import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeroSection, FeaturesSection, CTASection, CoinsSection } from "@/components/landing/LandingSections";
import { useAuth } from "@/components/AuthProvider";

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if URL has a recovery token
    const isRecovery = window.location.hash.includes("type=recovery");
    
    if (!loading && user && !isRecovery) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <CoinsSection />
      <CTASection />
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 DailyDots. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Terms of Service
            </Link>
            <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
