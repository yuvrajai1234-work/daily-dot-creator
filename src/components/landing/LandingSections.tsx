import { Button } from "@/components/ui/button";
import { ArrowRight, Target, TrendingUp, Users, Zap, CheckCircle, BarChart3, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-primary/20 to-background/90" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-16 h-16 glass rounded-full animate-pulse" />
        <div className="absolute top-40 right-32 w-12 h-12 glass rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-32 left-16 w-20 h-20 glass rounded-full animate-pulse delay-500" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="glass rounded-3xl p-8 md:p-12 shadow-card-deep"
        >
          <h1 className="text-5xl md:text-8xl font-bold mb-6 gradient-hero bg-clip-text text-transparent">
            DailyDots
          </h1>

          <p className="text-lg md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your daily routines into powerful habits with AI-powered insights,
            community support, and gamified progress tracking
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="text-lg px-8 py-6 gradient-primary shadow-primary-glow hover:opacity-90 transition-smooth"
              onClick={() => navigate("/sign-up")}
            >
              Start Your Journey <ArrowRight className="ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 glass border-primary/30 hover:border-primary/60 transition-smooth"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Features
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Target, label: "4-Level Tracking", color: "text-primary" },
              { icon: TrendingUp, label: "Progress Analytics", color: "text-success" },
              { icon: Zap, label: "AI Insights", color: "text-warning" },
              { icon: Users, label: "Community", color: "text-primary-glow" },
            ].map((item) => (
              <motion.div
                key={item.label}
                whileHover={{ scale: 1.05 }}
                className="glass rounded-full px-6 py-3 flex items-center justify-center gap-2 transition-smooth"
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: CheckCircle,
      title: "Habit Tracking",
      description: "Track your habits with a beautiful 4-level effort system. Mark your progress daily and watch your streaks grow.",
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Get personalized insights and recommendations powered by AI to help you optimize your routines.",
    },
    {
      icon: BarChart3,
      title: "Deep Analytics",
      description: "Visualize your progress with beautiful charts, weekly stats, and life balance spider webs.",
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Connect with like-minded individuals, share achievements, and stay motivated together.",
    },
    {
      icon: Target,
      title: "Achievements & Rewards",
      description: "Earn coins, unlock achievements, and redeem rewards as you build better habits.",
    },
    {
      icon: TrendingUp,
      title: "Daily Reflections",
      description: "Journal your thoughts, track your mood, and reflect on your growth journey.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="gradient-hero bg-clip-text text-transparent">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Packed with features to help you build habits, track progress, and stay motivated.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="glass rounded-2xl p-6 transition-smooth hover:border-primary/40"
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-10" />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Start Your Journey Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands building better habits. Every dot counts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-6 gradient-primary shadow-primary-glow hover:opacity-90"
              onClick={() => navigate("/sign-up")}
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-primary/30"
              onClick={() => navigate("/sign-in")}
            >
              Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const CoinsSection = () => {
  return (
    <section className="py-20 bg-secondary/10 border-t border-border/50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 animate-text-gradient bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Level Up Your Game with Daily Dots Coins!
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to grind for A Coins or splurge on P Coins? Start earning now and turn discipline into discounts!
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 border-t-4 border-t-primary shadow-lg"
          >
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl shadow-inner">A</span>
              Earn A Coins the Hard Way
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              A Coins are your sweat-earned currency. Track habits, crush workouts, and hit daily goals to rack them up. Our motto: <strong className="text-foreground">1 A Coin = ₹1</strong> — Real value, no fluff.
            </p>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3 text-sm text-foreground/80">
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <span>Redeem for in-app rewards like premium themes, custom habit trackers, or exclusive badges.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground/80">
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <span>Buy real-world products at killer discounts: fitness gear, supplements, or tech gadgets from our partners.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground/80">
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <span><em>Pro Tip:</em> Every push-up or streak counts. Turn discipline into discounts!</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 border-t-4 border-t-yellow-500 shadow-lg"
          >
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-yellow-500">
              <span className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-xl shadow-inner text-yellow-500">P</span>
              Unlock Elite Wins with P Coins
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              P Coins are your VIP pass to the big leagues—available exclusively via in-app purchases. Ready to compete for glory? Your next big win is one event away!
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-foreground/80">
                <CheckCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                <span>Enter elite athletic events & competitions: Boxing battles, fitness challenges, or virtual races.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground/80">
                <CheckCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                <span>Win massive rewards like ₹1 Lakh cash, sponsored trekking/camping trips, luxury stays, or premium health packages (spa retreats, anyone?).</span>
              </li>
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass rounded-2xl overflow-hidden shadow-xl"
        >
          <div className="bg-secondary/30 p-4 border-b border-border/50 text-center">
            <h4 className="font-bold text-lg">A Coins vs. P Coins: Quick Compare</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/10">
                  <th className="p-4 font-semibold border-b border-border/50 w-1/4">Feature</th>
                  <th className="p-4 font-semibold text-primary border-b border-border/50 w-3/8">A Coins (Earned)</th>
                  <th className="p-4 font-semibold text-yellow-500 border-b border-border/50 w-3/8">P Coins (Purchased)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/20 hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-muted-foreground font-medium">How to Get</td>
                  <td className="p-4 text-sm">Daily habits & challenges</td>
                  <td className="p-4 text-sm">In-app store purchases</td>
                </tr>
                <tr className="border-b border-border/20 hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-muted-foreground font-medium">Value</td>
                  <td className="p-4 text-sm font-semibold">1 A = ₹1</td>
                  <td className="p-4 text-sm font-semibold">Premium entry power</td>
                </tr>
                <tr className="border-b border-border/20 hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-muted-foreground font-medium">Best For</td>
                  <td className="p-4 text-sm">Everyday rewards & deals</td>
                  <td className="p-4 text-sm">Elite events & huge prizes</td>
                </tr>
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 text-muted-foreground font-medium">Top Rewards</td>
                  <td className="p-4 text-sm">Discounts, app perks</td>
                  <td className="p-4 text-sm">₹1L cash, trips, health luxuries</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export { HeroSection, FeaturesSection, CTASection, CoinsSection };
