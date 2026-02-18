import { Community } from "@/hooks/useCommunities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface CommunityLeaderboardProps {
    communities: Community[];
}

export const CommunityLeaderboard = ({ communities }: CommunityLeaderboardProps) => {
    // Sort communities by member count (mocked for now as XP per community isn't tracked yet)
    const sortedCommunities = [...communities].sort((a, b) => b.member_count - a.member_count).slice(0, 10);

    return (
        <Card className="glass border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="w-5 h-5 text-warning" /> Top Communities
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead className="w-[50px]">Rank</TableHead>
                            <TableHead>Community</TableHead>
                            <TableHead className="text-right">Members</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedCommunities.map((community, index) => (
                            <TableRow key={community.id} className="border-border/50 hover:bg-secondary/10">
                                <TableCell className="font-bold">
                                    {index + 1 <= 3 ? (
                                        <Badge variant="outline" className={`
                                            ${index === 0 ? "border-warning text-warning bg-warning/10" : ""}
                                            ${index === 1 ? "border-muted-foreground text-muted-foreground bg-muted/10" : ""}
                                            ${index === 2 ? "border-amber-700 text-amber-700 bg-amber-700/10" : ""}
                                        `}>
                                            #{index + 1}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground ml-2">#{index + 1}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{community.emoji}</span>
                                        <span className="font-medium truncate max-w-[120px]">{community.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-muted-foreground">
                                    {community.member_count}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
