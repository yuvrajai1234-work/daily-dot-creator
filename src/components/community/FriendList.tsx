import { Friend, useFriendships } from "@/hooks/useSocial";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, UserPlus, Search } from "lucide-react";

export const FriendList = () => {
    const { friends, acceptRequest, rejectRequest, isLoading } = useFriendships();

    // Filter pending requests that are received by the current user
    const pendingRequests = friends.filter(f => f.status === 'pending' && f.direction === 'received');
    const myFriends = friends.filter(f => f.status === 'accepted');

    return (
        <Card className="glass border-border/50 h-[500px] flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" /> Friends
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground">Requests</h4>
                        {pendingRequests.map(friend => (
                            <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/50">
                                <div className="flex items-center gap-2">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={friend.avatar_url} />
                                        <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{friend.username}</span>
                                </div>
                                <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-success hover:text-success hover:bg-success/10" onClick={() => acceptRequest(friend.friendship_id)}>
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => rejectRequest(friend.friendship_id)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* My Friends */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">My Friends ({myFriends.length})</h4>
                    <div className="relative mb-2">
                        <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                        <Input placeholder="Search friends..." className="h-8 pl-7 text-xs bg-secondary/30" />
                    </div>
                    <ScrollArea className="flex-1 -mr-3 pr-3">
                        <div className="space-y-2">
                            {myFriends.map(friend => (
                                <div key={friend.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/20 transition-colors cursor-pointer group">
                                    <Avatar className="w-8 h-8 border border-border/30">
                                        <AvatarImage src={friend.avatar_url} />
                                        <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-medium truncate">{friend.username}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">Online 2m ago</p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-success opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                            {myFriends.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4">
                                    No friends yet. Join a community to find some!
                                </p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
};
