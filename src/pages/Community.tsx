import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, Plus, LogOut, Trophy, Activity, MessageSquare, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCommunities, JOIN_COST, CREATE_COST, Community } from "@/hooks/useCommunities";
import { Skeleton } from "@/components/ui/skeleton";
import { CommunityDetailView } from "@/components/community/CommunityDetailView";
import { CommunityLeaderboard } from "@/components/community/CommunityLeaderboard";
import { FriendList } from "@/components/community/FriendList";

const EMOJIS = ["🎯", "🌅", "💻", "🥗", "🧘", "📚", "🏋️", "🎨", "🎵", "🌿", "🔥", "⭐", "🚀", "💡", "🎮", "🌍"];
const CATEGORIES = ["General", "Health", "Productivity", "Mindfulness", "Coding", "Fitness", "Learning", "Social", "Creative", "Gaming"];

const CommunityPage = () => {
  const { communities, isLoading, isMember, joinCommunity, createCommunity } = useCommunities();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [form, setForm] = useState({ name: "", tagline: "", emoji: "🎯", habit_category: "General" });

  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.habit_category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createCommunity.mutate(form, {
      onSuccess: (newCommunity) => {
        setCreateOpen(false);
        setForm({ name: "", tagline: "", emoji: "🎯", habit_category: "General" });
        // Optionally auto-select the new community
        setSelectedCommunity(newCommunity);
      },
    });
  };

  // Render detail view if a community is selected
  if (selectedCommunity) {
    return (
      <CommunityDetailView
        community={selectedCommunity}
        onBack={() => setSelectedCommunity(null)}
      />
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto p-6">
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Community Hub</h1>
            <p className="text-muted-foreground">Find your tribe, build habits together, and climb the ranks.</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary border-0 gap-2 shadow-lg hover:shadow-xl transition-all w-full md:w-auto">
                  <Plus className="w-4 h-4" /> Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a New Team</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Team Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. 5 AM Club"
                      className="bg-secondary/30"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      value={form.tagline}
                      onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                      placeholder="Rise and shine!"
                      className="bg-secondary/30"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Emoji Icon</Label>
                    <div className="flex flex-wrap gap-2 p-2 bg-secondary/20 rounded-lg border border-border/50 max-h-[120px] overflow-y-auto">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                          className={`text-2xl w-10 h-10 flex items-center justify-center rounded-md transition-all ${form.emoji === e
                            ? "bg-primary text-primary-foreground scale-110 shadow-md ring-2 ring-offset-1 ring-offset-background ring-primary"
                            : "hover:bg-secondary/50 hover:scale-105"
                            }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={form.habit_category} onValueChange={(v) => setForm((f) => ({ ...f, habit_category: v }))}>
                      <SelectTrigger className="bg-secondary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full gradient-primary border-0 mt-2"
                    onClick={handleCreate}
                    disabled={createCommunity.isPending || !form.name.trim()}
                  >
                    {createCommunity.isPending ? (
                      <><span className="animate-spin mr-2">⏳</span> Creating...</>
                    ) : (
                      `Create Team (${CREATE_COST} 🪙)`
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content: Community List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass border-border/50 sticky top-0 z-10">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search communities..."
                    className="pl-9 bg-secondary/30 border-border focus-visible:ring-primary/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-56 rounded-xl w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Card className="glass border-border/50 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No communities found</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Be the first to create a community for "{search}" or browse other categories.
                </p>
                <Button onClick={() => setCreateOpen(true)} variant="outline">Create New Community</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filtered.map((community, i) => {
                    const joined = isMember(community.id);
                    return (
                      <motion.div
                        key={community.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        layoutId={community.id}
                      >
                        <Card className={`glass border-border/50 overflow-hidden h-full flex flex-col hover:border-primary/30 transition-colors group ${joined ? "ring-1 ring-primary/20" : ""}`}>
                          <div className="h-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center relative">
                            <span className="text-5xl drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">{community.emoji}</span>
                            {joined && (
                              <div className="absolute top-2 right-2">
                                <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">MEMBER</span>
                              </div>
                            )}
                          </div>
                          <CardHeader className="pb-2">
                            <CardTitle className="truncate" title={community.name}>{community.name}</CardTitle>
                            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{community.tagline}</p>
                          </CardHeader>
                          <CardContent className="pb-2 flex-grow">
                            <div className="flex justify-between text-sm text-muted-foreground mt-2">
                              <span className="flex items-center gap-1 bg-secondary/30 px-2 py-1 rounded-md text-xs">
                                <Users className="w-3 h-3" /> {community.member_count}
                              </span>
                              <span className="font-medium text-primary text-xs bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                                {community.habit_category}
                              </span>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-2">
                            {joined ? (
                              <Button
                                className="w-full gap-2 gradient-primary border-0 shadow-md hover:shadow-lg transition-all"
                                onClick={() => setSelectedCommunity(community)}
                              >
                                <MessageSquare className="w-4 h-4" /> Open Chat
                              </Button>
                            ) : (
                              <Button
                                className="w-full border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-primary gap-2"
                                variant="outline"
                                onClick={() => joinCommunity.mutate(community.id)}
                                disabled={joinCommunity.isPending}
                              >
                                {joinCommunity.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Join ({JOIN_COST} 🪙)
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Sidebar: Leaderboard & Friends */}
          <div className="space-y-6">
            <CommunityLeaderboard communities={communities} />
            <FriendList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
