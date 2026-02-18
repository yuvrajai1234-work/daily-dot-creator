import { Community, useCommunityMembers, useCommunities } from "@/hooks/useCommunities";
import { CommunityChat } from "./CommunityChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, UserPlus, Clock, UserCheck, X, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useFriendships } from "@/hooks/useSocial";
import { motion } from "framer-motion";

interface CommunityDetailViewProps {
    community: Community;
    onBack: () => void;
}

export const CommunityDetailView = ({ community, onBack }: CommunityDetailViewProps) => {
    const { user } = useAuth();
    const { data: members = [], isLoading: membersLoading } = useCommunityMembers(community.id);
    const { friends, sendRequest, acceptRequest, rejectRequest, isLoading: friendsLoading } = useFriendships();
    const { leaveCommunity } = useCommunities();

    const handleLeave = () => {
        if (confirm("Are you sure you want to leave this community?")) {
            leaveCommunity.mutate(community.id, {
                onSuccess: () => onBack(),
            });
        }
    };

    const getFriendStatus = (userId: string) => {
        // Check if this member is in our friends list
        // friends list contains object {id: friendId, status, direction, friendship_id}
        return friends.find((f) => f.id === userId);
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-border/50 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-secondary/20">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{community.emoji}</span>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                {community.name}
                                <Badge variant="outline" className="text-muted-foreground font-normal text-xs">
                                    {community.habit_category}
                                </Badge>
                            </h1>
                            <p className="text-sm text-muted-foreground">{community.tagline}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
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
                    <Card className="glass border-border/50 h-full flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4" /> Members ({members.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            {membersLoading ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin w-5 h-5 text-muted-foreground" /></div>
                            ) : (
                                <ScrollArea className="h-full px-4 pb-4">
                                    <div className="space-y-3 pt-2">
                                        {members.map((member: any) => {
                                            const isMe = member.userId === user?.id;
                                            const friendStatus = !isMe ? getFriendStatus(member.userId) : null;

                                            return (
                                                <div key={member.userId} className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <Avatar className="w-8 h-8 border border-border/30">
                                                            <AvatarImage src={member.avatarUrl} />
                                                            <AvatarFallback>{member.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-medium truncate flex items-center gap-1">
                                                                {member.username || "Unknown User"}
                                                                {isMe && <span className="text-[10px] text-muted-foreground">(You)</span>}
                                                            </span>
                                                            {member.role === 'admin' && (
                                                                <Badge variant="secondary" className="text-[10px] h-4 px-1 w-fit">Admin</Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {!isMe && (
                                                        <div className="flex items-center">
                                                            {!friendStatus ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Add Friend"
                                                                    disabled={friendsLoading}
                                                                    onClick={() => sendRequest.mutate(member.userId)}
                                                                >
                                                                    <UserPlus className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                                </Button>
                                                            ) : friendStatus.status === 'accepted' ? (
                                                                <UserCheck className="w-4 h-4 text-primary" title="Friend" />
                                                            ) : friendStatus.status === 'pending' ? (
                                                                friendStatus.direction === 'sent' ? (
                                                                    <Clock className="w-4 h-4 text-muted-foreground" title="Request Sent" />
                                                                ) : (
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            variant="ghost" size="icon" className="h-6 w-6 text-success hover:bg-success/10"
                                                                            onClick={() => acceptRequest(friendStatus.friendship_id)}
                                                                            title="Accept"
                                                                        >
                                                                            <Check className="w-3 h-3" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10"
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
