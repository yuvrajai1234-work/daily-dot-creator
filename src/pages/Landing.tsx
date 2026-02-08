import { Link } from "react-router-dom";
import { HeroSection, FeaturesSection, CTASection } from "@/components/landing/LandingSections";

const Landing = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <FeaturesSection />
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
