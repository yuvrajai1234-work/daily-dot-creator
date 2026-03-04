import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Community } from "@/hooks/useCommunities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Zap, Users, Loader2 } from "lucide-react";

interface CommunityLeaderboardProps {
    communities: Community[];
}

interface CommunityXPEntry {
    communityId: string;
    name: string;
    emoji: string;
    totalXP: number;
    memberCount: number;
}

const useCommunitiesXP = (communities: Community[]) => {
    return useQuery({
        queryKey: ["communities-xp", communities.map(c => c.id).join(",")],
        queryFn: async (): Promise<CommunityXPEntry[]> => {
            if (communities.length === 0) return [];

            // Fetch all members for all communities in one query
            const { data: members, error: memErr } = await supabase
                .from("community_members")
                .select("community_id, user_id");

            if (memErr) throw memErr;

            // Group user_ids by community
            const communityUserMap = new Map<string, string[]>();
            for (const m of members || []) {
                if (!communityUserMap.has(m.community_id)) {
                    communityUserMap.set(m.community_id, []);
                }
                communityUserMap.get(m.community_id)!.push(m.user_id);
            }

            // Collect all unique user ids
            const allUserIds = [...new Set((members || []).map(m => m.user_id))];
            if (allUserIds.length === 0) {
                return communities.map(c => ({
                    communityId: c.id,
                    name: c.name,
                    emoji: c.emoji,
                    totalXP: 0,
                    memberCount: c.member_count || 0,
                }));
            }

            // Fetch total_xp for all users in one query
            const { data: profiles, error: profErr } = await supabase
                .from("profiles")
                .select("user_id, total_xp")
                .in("user_id", allUserIds);

            if (profErr) throw profErr;

            const xpMap = new Map<string, number>();
            for (const p of profiles || []) {
                xpMap.set(p.user_id, (p as any).total_xp || 0);
            }

            // Calculate total XP per community
            return communities.map(community => {
                const memberIds = communityUserMap.get(community.id) || [];
                const totalXP = memberIds.reduce((sum, uid) => sum + (xpMap.get(uid) || 0), 0);
                return {
                    communityId: community.id,
                    name: community.name,
                    emoji: community.emoji,
                    totalXP,
                    memberCount: memberIds.length,
                };
            });
        },
        enabled: communities.length > 0,
        staleTime: 60_000,
    });
};

export const CommunityLeaderboard = ({ communities }: CommunityLeaderboardProps) => {
    const { data: xpEntries, isLoading } = useCommunitiesXP(communities);

    const sorted = [...(xpEntries || [])].sort((a, b) => b.totalXP - a.totalXP).slice(0, 10);

    const medalColors = [
        "border-yellow-500 text-yellow-500 bg-yellow-500/10",
        "border-zinc-400 text-zinc-400 bg-zinc-400/10",
        "border-amber-700 text-amber-700 bg-amber-700/10",
    ];

    return (
        <Card className="glass border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="w-5 h-5 text-yellow-500" /> Community Leaderboard
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    Ranked by combined total XP of all members
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Calculating XP rankings...</span>
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">No communities yet.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/50 hover:bg-transparent">
                                <TableHead className="w-[60px]">Rank</TableHead>
                                <TableHead>Community</TableHead>
                                <TableHead className="text-right">
                                    <span className="flex items-center justify-end gap-1">
                                        <Users className="w-3.5 h-3.5" /> Members
                                    </span>
                                </TableHead>
                                <TableHead className="text-right">
                                    <span className="flex items-center justify-end gap-1">
                                        <Zap className="w-3.5 h-3.5 text-primary" /> Total XP
                                    </span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sorted.map((entry, index) => (
                                <TableRow key={entry.communityId} className="border-border/50 hover:bg-secondary/10 transition-colors">
                                    <TableCell className="font-bold">
                                        {index < 3 ? (
                                            <Badge variant="outline" className={medalColors[index]}>
                                                #{index + 1}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground ml-2">#{index + 1}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{entry.emoji}</span>
                                            <div>
                                                <p className="font-medium truncate max-w-[140px]">{entry.name}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-muted-foreground text-sm">
                                        {entry.memberCount}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-bold text-primary font-mono">
                                            {entry.totalXP.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-1">XP</span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};
