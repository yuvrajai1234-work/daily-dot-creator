import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Search, Users, Trophy, MessageCircle, Target } from "lucide-react";
import { motion } from "framer-motion";

const mockCommunities = [
  { id: "1", name: "5 AM Club", tagline: "Rise and shine!", members: 125, habit: "Productivity", emoji: "🌅" },
  { id: "2", name: "100 Days of Code", tagline: "Code every single day.", members: 842, habit: "Coding", emoji: "💻" },
  { id: "3", name: "No Sugar January", tagline: "Commit to a healthier you.", members: 341, habit: "Health", emoji: "🥗" },
  { id: "4", name: "Daily Meditation", tagline: "Find your inner peace.", members: 520, habit: "Mindfulness", emoji: "🧘" },
];

const mockMembers = [
  { id: "u1", name: "Alice", rank: 1, points: 1520, streak: 45 },
  { id: "u2", name: "Bob", rank: 2, points: 1480, streak: 42 },
  { id: "u3", name: "Charlie", rank: 3, points: 1300, streak: 30 },
  { id: "u4", name: "David", rank: 4, points: 1150, streak: 25 },
];

const mockMessages = [
  { id: "m1", name: "Alice", content: "Just finished my coding session for the day! #Day23", timestamp: "10:30 AM" },
  { id: "m2", name: "Charlie", content: "Nice one, Alice! I'm struggling a bit with React hooks.", timestamp: "10:32 AM" },
  { id: "m3", name: "Alice", content: "Happy to help if you have questions!", timestamp: "10:35 AM" },
];

const mockChallenges = [
  { id: "c1", name: "Log 20 Times This Month", description: "Commit to coding for 20 days.", progress: 15, goal: 20 },
  { id: "c2", name: "Deploy a Project", description: "Ship a small project by end of week.", progress: 0, goal: 1 },
];

interface Community {
  id: string;
  name: string;
  tagline: string;
  members: number;
  habit: string;
  emoji: string;
}

const CommunityPage = () => {
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  if (selectedCommunity) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{selectedCommunity.name}</h1>
          <p className="text-muted-foreground">{selectedCommunity.tagline}</p>
        </div>

        <Card className="glass border-border/50 overflow-hidden">
          <div className="relative h-32 gradient-hero">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h2 className="text-2xl font-bold">{selectedCommunity.emoji} {selectedCommunity.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedCommunity.members} members</p>
            </div>
          </div>
          <CardFooter className="flex justify-between p-3">
            <Button variant="outline" onClick={() => setSelectedCommunity(null)}>Leave Community</Button>
            <Button className="gradient-primary border-0">Invite</Button>
          </CardFooter>
        </Card>

        <Tabs defaultValue="chat">
          <TabsList className="bg-secondary/50 w-full">
            <TabsTrigger value="chat" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Chat</TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Leaderboard</TabsTrigger>
            <TabsTrigger value="members" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Members</TabsTrigger>
            <TabsTrigger value="challenges" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Challenges</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <Card className="glass border-border/50">
              <div className="h-[50vh] flex flex-col">
                <div className="flex-grow space-y-4 p-4 overflow-y-auto">
                  {mockMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">{msg.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <p className="font-semibold text-sm">{msg.name}</p>
                          <p className="text-xs text-muted-foreground">{msg.timestamp}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input placeholder="Type a message..." className="bg-secondary/30 border-border" />
                    <Button className="gradient-primary border-0">Send</Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="space-y-2">
              {mockMembers.map((member) => (
                <Card key={member.id} className="glass border-border/50 p-3">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold w-6">{member.rank}</span>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/20 text-primary">{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold flex-grow">{member.name}</p>
                    <div className="text-right">
                      <p className="font-bold">{member.points} pts</p>
                      <p className="text-sm text-muted-foreground">{member.streak}-day streak</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mockMembers.map((member) => (
                <Card key={member.id} className="glass border-border/50 p-4 flex flex-col items-center gap-2">
                  <Avatar>
                    <AvatarFallback className="bg-primary/20 text-primary">{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm">{member.name}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="challenges">
            <div className="space-y-4">
              {mockChallenges.map((challenge) => (
                <Card key={challenge.id} className="glass border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{challenge.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{challenge.progress} / {challenge.goal}</span>
                    </div>
                    <Progress value={(challenge.progress / challenge.goal) * 100} className="h-2" />
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline">Join Challenge</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Community</h1>
        <p className="text-muted-foreground">Find your tribe and build habits together</p>
      </div>

      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search communities..." className="pl-8 bg-secondary/30 border-border" />
            </div>
            <Button variant="outline">Filters</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockCommunities.map((community, i) => (
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
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {community.members} members</span>
                  <span className="font-bold text-primary">{community.habit}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full gradient-primary border-0 hover:opacity-90" onClick={() => setSelectedCommunity(community)}>
                  Join
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
