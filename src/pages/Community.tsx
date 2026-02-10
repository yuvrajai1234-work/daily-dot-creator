import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Plus, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useCommunities } from "@/hooks/useCommunities";
import { Skeleton } from "@/components/ui/skeleton";

const EMOJIS = ["🎯", "🌅", "💻", "🥗", "🧘", "📚", "🏋️", "🎨", "🎵", "🌿", "🔥", "⭐"];
const CATEGORIES = ["General", "Health", "Productivity", "Mindfulness", "Coding", "Fitness", "Learning", "Social"];

const CommunityPage = () => {
  const { communities, isLoading, isMember, joinCommunity, leaveCommunity, createCommunity } = useCommunities();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", tagline: "", emoji: "🎯", habit_category: "General" });

  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.habit_category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createCommunity.mutate(form, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm({ name: "", tagline: "", emoji: "🎯", habit_category: "General" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="text-muted-foreground">Find your tribe and build habits together</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0 gap-2">
              <Plus className="w-4 h-4" /> Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Team Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. 5 AM Club"
                  className="bg-secondary/30 border-border"
                />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input
                  value={form.tagline}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                  placeholder="Rise and shine!"
                  className="bg-secondary/30 border-border"
                />
              </div>
              <div>
                <Label>Emoji</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                      className={`text-2xl p-1 rounded-md transition-colors ${form.emoji === e ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-secondary/50"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.habit_category} onValueChange={(v) => setForm((f) => ({ ...f, habit_category: v }))}>
                  <SelectTrigger className="bg-secondary/30 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gradient-primary border-0" onClick={handleCreate} disabled={createCommunity.isPending}>
                {createCommunity.isPending ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              className="pl-8 bg-secondary/30 border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass border-border/50 p-8 text-center">
          <p className="text-muted-foreground">No communities found. Create one!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((community, i) => {
            const joined = isMember(community.id);
            return (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3 }}
              >
                <Card className="glass border-border/50 overflow-hidden">
                  <div className="h-24 gradient-card flex items-center justify-center">
                    <span className="text-5xl">{community.emoji}</span>
                  </div>
                  <CardHeader>
                    <CardTitle>{community.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{community.tagline}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {community.member_count} members
                      </span>
                      <span className="font-bold text-primary">{community.habit_category}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {joined ? (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => leaveCommunity.mutate(community.id)}
                        disabled={leaveCommunity.isPending}
                      >
                        <LogOut className="w-4 h-4" /> Leave
                      </Button>
                    ) : (
                      <Button
                        className="w-full gradient-primary border-0 hover:opacity-90"
                        onClick={() => joinCommunity.mutate(community.id)}
                        disabled={joinCommunity.isPending}
                      >
                        Join
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
