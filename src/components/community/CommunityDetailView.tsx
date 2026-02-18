import { useState } from "react";
import { Community, useCommunityMembers, useCommunities } from "@/hooks/useCommunities";
import { CommunityChat } from "./CommunityChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, UserPlus, Clock, UserCheck, X, Check, Loader2, Settings, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useFriendships } from "@/hooks/useSocial";
import { CommunitySettingsDialog } from "./CommunitySettingsDialog";

interface CommunityDetailViewProps {
    community: Community;
    onBack: () => void;
}

export const CommunityDetailView = ({ community, onBack }: CommunityDetailViewProps) => {
    const { user } = useAuth();
    const { data: members = [], isLoading: membersLoading } = useCommunityMembers(community.id);
    const { friends, sendRequest, acceptRequest, rejectRequest, isLoading: friendsLoading } = useFriendships();
    const { leaveCommunity } = useCommunities();
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Find my role
    const myMember = members.find((m: any) => m.userId === user?.id);
    const isAdmin = myMember?.role === 'admin';

    const handleLeave = () => {
        if (confirm("Are you sure you want to leave this community?")) {
            leaveCommunity.mutate(community.id, {
                onSuccess: () => onBack(),
            });
        }
    };

    const getFriendStatus = (userId: string) => {
        return friends.find((f) => f.id === userId);
    };

    // Sort members: Admin -> Moderator -> Member
    const sortedMembers = [...members].sort((a: any, b: any) => {
        const roleOrder = { admin: 0, moderator: 1, member: 2 };
        return (roleOrder[a.role as keyof typeof roleOrder] || 2) - (roleOrder[b.role as keyof typeof roleOrder] || 2);
    });

    return (
        <div className="space-y-4 h-full flex flex-col">
            <CommunitySettingsDialog
                community={community}
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />

            {/* Header */}
            <div className="flex items-center justify-between bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-border/50 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-secondary/20">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl filter drop-shadow-md">{community.emoji}</span>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                {community.name}
                                <Badge variant="outline" className="text-muted-foreground font-normal text-xs bg-background/50">
                                    {community.habit_category}
                                </Badge>
                            </h1>
                            <p className="text-sm text-muted-foreground">{community.tagline}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} title="Community Settings">
                            <Settings className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLeave}>
                        Leave
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">

                {/* Chat Area - Takes up 3 columns */}
                <div className="lg:col-span-3 h-full min-h-[500px]">
                    <CommunityChat communityId={community.id} />
                </div>

                {/* Member Sidebar - Takes up 1 column */}
                <div className="lg:col-span-1 h-full min-h-[300px]">
                    <Card className="glass border-border/50 h-full flex flex-col shadow-lg">
                        <CardHeader className="pb-2 border-b border-border/10 bg-secondary/5">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" /> Members ({members.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0 bg-background/30">
                            {membersLoading ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin w-5 h-5 text-muted-foreground" /></div>
                            ) : (
                                <ScrollArea className="h-full">
                                    <div className="divide-y divide-border/10">
                                        {sortedMembers.map((member: any) => {
                                            const isMe = member.userId === user?.id;
                                            const friendStatus = !isMe ? getFriendStatus(member.userId) : null;

                                            return (
                                                <div key={member.userId} className="flex items-center justify-between p-3 transition-colors hover:bg-secondary/20 group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="relative">
                                                            <Avatar className={`w-9 h-9 border-2 ${member.role === 'admin' ? 'border-yellow-500/50 shadow-yellow-500/20 shadow-md' :
                                                                    member.role === 'moderator' ? 'border-purple-500/50 shadow-purple-500/20 shadow-md' :
                                                                        'border-border/30'
                                                                }`}>
                                                                <AvatarImage src={member.avatarUrl} />
                                                                <AvatarFallback>{member.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                                                            </Avatar>
                                                            {member.role === 'admin' && (
                                                                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[8px] p-0.5 rounded-full border border-background" title="Chief">
                                                                    <ShieldCheck className="w-2.5 h-2.5" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-medium truncate flex items-center gap-1.5">
                                                                {member.username || "Unknown"}
                                                                {isMe && <span className="text-[10px] text-muted-foreground font-normal">(You)</span>}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                {member.role === 'admin' && (
                                                                    <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Chief</Badge>
                                                                )}
                                                                {member.role === 'moderator' && (
                                                                    <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-purple-500/10 text-purple-600 border-purple-500/30">Elder</Badge>
                                                                )}
                                                                {member.role === 'member' && (
                                                                    <span className="text-[10px] text-muted-foreground">Tribe Member</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {!isMe && (
                                                        <div className="flex items-center">
                                                            {!friendStatus ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                                    title="Add Friend"
                                                                    disabled={friendsLoading}
                                                                    onClick={() => sendRequest.mutate(member.userId)}
                                                                >
                                                                    <UserPlus className="w-4 h-4" />
                                                                </Button>
                                                            ) : friendStatus.status === 'accepted' ? (
                                                                <UserCheck className="w-4 h-4 text-success opacity-80" title="Friend" />
                                                            ) : friendStatus.status === 'pending' ? (
                                                                friendStatus.direction === 'sent' ? (
                                                                    <Clock className="w-4 h-4 text-muted-foreground" title="Request Sent" />
                                                                ) : (
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            variant="ghost" size="icon" className="h-6 w-6 text-success hover:bg-success/10 hover:text-success"
                                                                            onClick={() => acceptRequest(friendStatus.friendship_id)}
                                                                            title="Accept"
                                                                        >
                                                                            <Check className="w-3 h-3" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                            onClick={() => rejectRequest(friendStatus.friendship_id)}
                                                                            title="Reject"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
};
