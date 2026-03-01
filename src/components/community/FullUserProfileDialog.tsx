import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Flame, Brain, Dumbbell, Zap, Coins, Clock, MapPin, User, Activity, Calendar, Users, Weight as WeightIcon, Ruler, Heart, Crown } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { getLevelInfo, getLevelTier } from "@/hooks/useXP";
import { useUserStats } from "@/hooks/useAchievements";

interface FullUserProfileDialogProps {
    userId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const FullUserProfileDialog = ({ userId, open, onOpenChange }: FullUserProfileDialogProps) => {
    const { data: profile, isLoading } = useQuery({
        queryKey: ["full-user-profile-dialog", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", userId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: open && !!userId,
    });

    const { data: realStats } = useUserStats(userId);

    const { data: stats } = useQuery({
        queryKey: ["full-user-stats-dialog", userId],
        queryFn: async () => {
            const p = profile as any;
            return {
                lifeBalance: p?.life_balance
                    ? (Array.isArray(p.life_balance)
                        ? p.life_balance
                        : Object.entries(p.life_balance).map(([k, v]) => ({ subject: k, score: Number(v) })))
                    : null,
                age: p?.age,
                weight: p?.weight,
                height: p?.height,
                bmi: p?.bmi,
                bodyType: p?.body_type,
                status: p?.status,
                archetype: p?.archetype,
                personalityTraits: p?.personality_traits || [],
            };
        },
        enabled: open && !!userId && !!profile,
    });

    if (!profile && isLoading) return null;
    if (!profile) return null;

    const levelInfo = getLevelInfo({
        level: profile.level || 1,
        current_xp: profile.current_xp || 0,
        total_xp: profile.total_xp || 0
    });
    const tier = getLevelTier(levelInfo.level);
    const p = profile as any;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto glass border-border/50 p-0 bg-popover/90 backdrop-blur-xl custom-scrollbar">
                {/* Header Banner area */}
                <div
                    className="h-32 w-full relative"
                    style={{ background: p?.banner_url ? `url(${p.banner_url}) center/cover` : tier.color, opacity: 0.9 }}
                >
                    <div className="absolute -bottom-12 left-6">
                        <Avatar className="w-24 h-24 border-4 border-popover shadow-xl">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="text-3xl">{profile.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                <div className="pt-14 px-6 pb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">{p?.full_name || "Unknown User"}</h2>
                            <p className="text-muted-foreground flex items-center gap-1 mt-1">
                                {p?.designation || "Member"}
                                {p?.location && <><MapPin className="w-3 h-3 ml-2" /> {p.location}</>}
                            </p>
                            {p?.bio && <p className="text-sm italic mt-2 text-foreground/80">"{p.bio}"</p>}
                        </div>
                        <div className="text-right">
                            <Badge variant="outline" className="text-sm px-3 py-1 font-bold border-2" style={{ borderColor: tier.color, color: tier.color }}>
                                Lvl {levelInfo.level} - {tier.name}
                            </Badge>
                            <div className="mt-2 text-xs text-muted-foreground flex gap-3 justify-end whitespace-nowrap">
                                <span className="flex items-center gap-1 text-yellow-500 font-bold"><Coins className="w-4 h-4" /> {profile.coin_balance || 0}</span>
                                <span className="flex items-center gap-1 font-bold"><Zap className="w-4 h-4 text-blue-500" /> {profile.total_xp || 0}</span>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-4 h-auto flex-wrap sm:flex-nowrap">
                            <TabsTrigger value="basic" className="text-xs sm:text-sm py-2">Profile</TabsTrigger>
                            <TabsTrigger value="habits" className="text-xs sm:text-sm py-2">Habits</TabsTrigger>
                            <TabsTrigger value="balance" className="text-xs sm:text-sm py-2">Balance</TabsTrigger>
                            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">Stats</TabsTrigger>
                        </TabsList>

                        {/* Basic Profile Window */}
                        <TabsContent value="basic" className="animate-in fade-in-50 slide-in-from-bottom-2 space-y-8">
                            <div>
                                <h3 className="text-xl font-bold mb-4">Personality Traits</h3>
                                <div className="flex flex-wrap gap-2">
                                    {stats?.personalityTraits && stats.personalityTraits.length > 0 ? (
                                        stats.personalityTraits.map((trait: string, idx: number) => (
                                            <Badge key={idx} variant="secondary" className="bg-[#9b51e0]/20 text-[#9b51e0] hover:bg-[#9b51e0]/30 text-sm py-1.5 px-4 rounded-full font-semibold">
                                                {trait}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground">--</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold mb-4">Details</h3>
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-foreground font-semibold flex items-center gap-3"><Calendar className="w-5 h-5 opacity-70" /> Age</span>
                                        <span className="text-muted-foreground">{stats?.age || '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-foreground font-semibold flex items-center gap-3"><Users className="w-5 h-5 opacity-70" /> Gender</span>
                                        <span className="text-muted-foreground capitalize">{p?.gender || '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-foreground font-semibold flex items-center gap-3"><WeightIcon className="w-5 h-5 opacity-70" /> Weight (kg)</span>
                                        <span className="text-muted-foreground">{stats?.weight || '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-foreground font-semibold flex items-center gap-3"><Ruler className="w-5 h-5 opacity-70" /> Height (cm)</span>
                                        <span className="text-muted-foreground">{stats?.height || '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-foreground font-semibold flex items-center gap-3"><Heart className="w-5 h-5 opacity-70" /> BMI</span>
                                        <span className="font-semibold text-purple-500">{stats?.bmi || '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-foreground font-semibold flex items-center gap-3"><User className="w-5 h-5 opacity-70" /> Body Type</span>
                                        <span className="text-muted-foreground">{stats?.bodyType || '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-foreground font-semibold flex items-center gap-3"><Heart className="w-5 h-5 opacity-70" /> Status</span>
                                        <span className="text-muted-foreground">{stats?.status || '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-foreground font-semibold flex items-center gap-3"><MapPin className="w-5 h-5 opacity-70" /> Location</span>
                                        <span className="text-muted-foreground">{p?.location || '--'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-foreground font-semibold flex items-center gap-3"><Crown className="w-5 h-5 opacity-70" /> Archetype</span>
                                        <span className="text-muted-foreground">{stats?.archetype || '--'}</span>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Habits & Streak Window */}
                        <TabsContent value="habits" className="animate-in fade-in-50 slide-in-from-bottom-2">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Total Habits", value: realStats?.totalHabits ?? '--', color: "text-primary" },
                                    { label: "Completions", value: realStats?.totalCompletions ?? '--', color: "text-success" },
                                    { label: "Current Streak", value: realStats?.currentStreak != null ? `${realStats.currentStreak} days` : '--', color: "text-warning" },
                                    { label: "Best Streak", value: realStats?.bestStreak != null ? `${realStats.bestStreak} days` : '--', color: "text-orange-400" },
                                    { label: "Reflections", value: realStats?.totalReflections ?? '--', color: "text-primary" },
                                ].map((stat) => (
                                    <Card key={stat.label} className="bg-secondary/30 border-none">
                                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Life Balance Window */}
                        <TabsContent value="balance" className="animate-in fade-in-50 slide-in-from-bottom-2">
                            <Card className="bg-secondary/30 border-none">
                                <CardContent className="p-0 flex justify-center py-4">
                                    {stats?.lifeBalance && Array.isArray(stats.lifeBalance) && stats.lifeBalance.length > 0 ? (
                                        <div className="w-full h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.lifeBalance}>
                                                    <PolarGrid stroke="hsl(var(--border))" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar name="Balance" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                                            <Activity className="w-8 h-8 opacity-50" />
                                            <span>No Data Available</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Analytics Window */}
                        <TabsContent value="analytics" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2">
                            <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                <Card className="bg-secondary/30 border-none col-span-3">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center h-24">
                                        <div className="text-3xl font-bold text-primary mb-1">{realStats?.totalReflections ?? '--'}</div>
                                        <div className="text-xs text-muted-foreground">Total Reflections</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-secondary/30 border-none flex flex-col justify-center">
                                    <CardContent className="p-3 sm:p-4 text-center">
                                        <div className="text-xl sm:text-2xl font-bold text-yellow-500 mb-1">{profile.coin_balance || 0}</div>
                                        <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">Prime Coins</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-secondary/30 border-none flex flex-col justify-center">
                                    <CardContent className="p-3 sm:p-4 text-center">
                                        <div className="text-xl sm:text-2xl font-bold text-yellow-500 mb-1">{profile.a_coin_balance || 0}</div>
                                        <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">Achievement</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-secondary/30 border-none flex flex-col justify-center">
                                    <CardContent className="p-3 sm:p-4 text-center">
                                        <div className="text-xl sm:text-2xl font-bold text-blue-500 mb-1">{profile.b_coin_balance || 0}</div>
                                        <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">Build Coins</div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};
