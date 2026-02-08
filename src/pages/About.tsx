import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Target, Users, Sparkles, BookOpen, Trophy } from "lucide-react";

const features = [
  { icon: Target, text: "Track habits with progress bars, analytics, and detailed habit cycles to see your growth in real time." },
  { icon: Trophy, text: "Earn coins and redeem rewards as you achieve goals, making habit-building a gamified experience." },
  { icon: Users, text: "Join a supportive community to chat, share reflections, and motivate each other every day." },
  { icon: Sparkles, text: "Personalize your journey with AI motivation, instant reminders, and achievement-based incentives." },
  { icon: BookOpen, text: "Access curated e-books and resources to inspire your growth and self-improvement journey." },
];

const teamMembers = [
  { name: "Yuvraj Singh Thakur", role: "Co-founder & CEO", initials: "YS" },
  { name: "Akshat Singh", role: "Co-founder & CTO", initials: "AS" },
];

const AboutPage = () => {
  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-4xl font-bold gradient-hero bg-clip-text text-transparent">About DailyDots</h1>
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-center space-y-4">
        <p className="text-lg text-muted-foreground leading-relaxed">
          DailyDots was created to empower individuals on their journey of self-improvement by making daily discipline,
          habit-building, and personal reflection both engaging and rewarding. At its core, DailyDots combines advanced
          analytics, habit tracking, motivational tools, and a vibrant community space.
        </p>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Many people struggle to maintain good habits in today's fast-paced world. DailyDots addresses this with achievement
          systems, rewards, AI guidance, and community interaction to help users stay on track even when motivation fades.
        </p>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-3xl font-bold text-center mb-6">How We Help</h2>
        <div className="space-y-3">
          {features.map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Card className="glass border-border/50">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <p className="text-muted-foreground">{feature.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
        <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
        <Card className="gradient-hero border-0 shadow-primary-glow">
          <CardContent className="p-6">
            <p className="text-lg leading-relaxed">
              At DailyDots, our mission is simple: help users take consistent steps toward their best selves, leveraging
              technology, community, and motivation to create meaningful change in their lives.
            </p>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h2 className="text-3xl font-bold text-center mb-6">Meet the Team</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {teamMembers.map((member) => (
            <Card key={member.name} className="glass border-border/50 w-full md:w-72">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4 border-4 border-primary/30">
                  <AvatarFallback className="bg-primary/20 text-primary text-xl">{member.initials}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-bold">{member.name}</h3>
                <p className="text-muted-foreground text-sm">{member.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default AboutPage;
