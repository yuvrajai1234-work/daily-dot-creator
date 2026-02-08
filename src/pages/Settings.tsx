import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

const SettingsPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and account settings</p>
      </div>
      <Separator className="bg-border" />

      {/* Quick Toggles */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Quick Toggles</CardTitle>
            <CardDescription>Enable or disable key features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: "notifications", label: "Notifications", defaultChecked: true },
              { id: "daily-reminders", label: "Daily Reminders", defaultChecked: true, hasTime: true },
              { id: "dark-mode", label: "Dark Mode", defaultChecked: true },
              { id: "haptic-feedback", label: "Haptic Feedback", defaultChecked: false },
            ].map((toggle) => (
              <div key={toggle.id} className="flex items-center justify-between">
                <label htmlFor={toggle.id} className="font-medium text-sm">{toggle.label}</label>
                <div className="flex items-center gap-2">
                  {toggle.hasTime && <Input type="time" defaultValue="09:00" className="w-[120px] bg-secondary/30 border-border text-sm" />}
                  <Switch id={toggle.id} defaultChecked={toggle.defaultChecked} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Habit Preferences */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Habit Preferences</CardTitle>
            <CardDescription>Customize how you track and manage habits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm">Default Cycle Length</label>
              <Select defaultValue="4-weeks">
                <SelectTrigger className="w-[180px] bg-secondary/30 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4-weeks">4 weeks</SelectItem>
                  <SelectItem value="6-weeks">6 weeks</SelectItem>
                  <SelectItem value="8-weeks">8 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm">Reminder Tone</label>
              <Select defaultValue="default-tone">
                <SelectTrigger className="w-[180px] bg-secondary/30 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default-tone">Default</SelectItem>
                  <SelectItem value="calm-tone">Calm</SelectItem>
                  <SelectItem value="energetic-tone">Energetic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Community & Privacy */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Community & Privacy</CardTitle>
            <CardDescription>Control visibility and data sharing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm">Profile Visibility</label>
              <Select defaultValue="public">
                <SelectTrigger className="w-[180px] bg-secondary/30 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="group">Group Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="group-discovery" className="font-medium text-sm">Group Discovery</label>
              <Switch id="group-discovery" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI & Personalization */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>AI & Personalization</CardTitle>
            <CardDescription>Tailor AI features to your liking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm">AI Coach Tone</label>
              <Select defaultValue="encouraging">
                <SelectTrigger className="w-[180px] bg-secondary/30 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="encouraging">Encouraging</SelectItem>
                  <SelectItem value="motivating">Motivating</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="personalized" className="font-medium text-sm">Personalized Suggestions</label>
              <Switch id="personalized" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm">Reflection History</label>
              <Select defaultValue="90-days">
                <SelectTrigger className="w-[180px] bg-secondary/30 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30-days">Keep 30 days</SelectItem>
                  <SelectItem value="90-days">Keep 90 days</SelectItem>
                  <SelectItem value="forever">Keep Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account & Support */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Account & Support</CardTitle>
            <CardDescription>Manage your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm">Change Password</label>
              <Button variant="outline" size="sm" onClick={() => toast.info("Password change coming soon!")}>Change</Button>
            </div>
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm text-destructive">Delete Account</label>
              <Button variant="destructive" size="sm" onClick={() => toast.error("Account deletion requires confirmation.")}>Delete</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">App Version</span>
              <span className="text-sm font-mono text-muted-foreground">1.0.2</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sign Out */}
      <div className="text-center pb-8">
        <Button variant="outline" size="lg" onClick={handleSignOut}>Log Out</Button>
      </div>
    </div>
  );
};

export default SettingsPage;
