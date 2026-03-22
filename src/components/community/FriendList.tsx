import { useState } from "react";
import { Friend, useFriendships, useUserSearch } from "@/hooks/useSocial";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, X, UserPlus, Search, Loader2, UserCheck, Clock, MoreHorizontal, User, UserMinus, ShieldBan, Flag } from "lucide-react";
import { FullUserProfileDialog } from "@/components/community/FullUserProfileDialog";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";



// ── Friend Context Menu ───────────────────────────────────────────────────────
const FriendContextMenu = ({
    friend,
    onViewProfile,
    onRemove,
}: {
    friend: Friend;
    onViewProfile: () => void;
    onRemove: (id: string) => void;
}) => {
    const handleBlock = () => {
        toast.info(`${friend.username} has been blocked.`);
    };

    const handleReport = () => {
        toast.info(`${friend.username} has been reported. Thank you for your feedback.`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-secondary/60"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 glass border-border/50">
                <DropdownMenuItem
                    className="gap-2 cursor-pointer text-xs"
                    onClick={onViewProfile}
                >
                    <User className="w-3.5 h-3.5 text-primary" />
                    View Profile
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => onRemove(friend.friendship_id)}
                >
                    <UserMinus className="w-3.5 h-3.5" />
                    Remove Friend
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={handleBlock}
                >
                    <ShieldBan className="w-3.5 h-3.5" />
                    Block User
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="gap-2 cursor-pointer text-xs text-orange-400 focus:text-orange-400 focus:bg-orange-500/10"
                    onClick={handleReport}
                >
                    <Flag className="w-3.5 h-3.5" />
                    Report User
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

// ── Main FriendList Component ─────────────────────────────────────────────────
export const FriendList = () => {
    const { friends, sendRequest, acceptRequest, rejectRequest, isLoading } = useFriendships();
    const { onlineUsers } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");

    // Profile dialog state
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

    // Add searching
    const { data: searchResults, isLoading: isSearchLoading } = useUserSearch(globalSearchQuery);

    // Filter pending requests
    const receivedRequests = friends.filter(f => f.status === 'pending' && f.direction === 'received');
    const sentRequests = friends.filter(f => f.status === 'pending' && f.direction === 'sent');
    const myFriends = friends.filter(f => f.status === 'accepted');

    // Filter local friends by search
    const filteredFriends = myFriends.filter(f => f.username?.toLowerCase().includes(searchQuery.toLowerCase()));

    const openProfile = (friend: Friend) => {
        setSelectedFriendId(friend.id);
        setProfileDialogOpen(true);
    };

    return (
        <>
            <Card className="glass border-border/50 h-full flex flex-col">
                <CardHeader className="pb-3 shrink-0">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" /> Friends
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden min-h-0 flex flex-col pb-2">
                    <Tabs defaultValue="friends" className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <TabsList className="grid w-full grid-cols-4 mb-4 shrink-0">
                            <TabsTrigger value="friends" className="text-xs">Friends</TabsTrigger>
                            <TabsTrigger value="requests" className="text-xs relative">
                                Reqs
                                {receivedRequests.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-destructive rounded-full text-[8px] flex items-center justify-center text-white">
                                        {receivedRequests.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                            <TabsTrigger value="add" className="text-xs bg-primary/10 text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Add</TabsTrigger>
                        </TabsList>

                        {/* My Friends Tab */}
                        <TabsContent value="friends" className="flex-1 flex flex-col min-h-0 overflow-hidden m-0 data-[state=active]:flex">
                            <div className="relative mb-3 shrink-0">
                                <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                                <Input
                                    placeholder="Search your friends..."
                                    className="h-8 pl-7 text-xs bg-secondary/30"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <ScrollArea className="flex-1 -mr-3 pr-3 h-full">
                                <div className="space-y-1 pb-4">
                                    {filteredFriends.map(friend => (
                                        <div
                                            key={friend.id}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/20 transition-colors cursor-pointer group"
                                            onClick={() => openProfile(friend)}
                                        >
                                            <Avatar className="w-10 h-10 border border-border/30 shrink-0">
                                                <AvatarImage src={friend.avatar_url} />
                                                <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden min-w-0">
                                                <p className="text-sm font-medium truncate">{friend.username}</p>
                                                <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                                    <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${onlineUsers.includes(friend.id) ? 'bg-success' : 'bg-muted'}`}></span> 
                                                    {onlineUsers.includes(friend.id) ? 'Online' : 'Offline'}
                                                </p>
                                            </div>
                                            {/* Context menu — visible on row hover */}
                                            <FriendContextMenu
                                                friend={friend}
                                                onViewProfile={() => openProfile(friend)}
                                                onRemove={(id) => rejectRequest(id)}
                                            />
                                        </div>
                                    ))}
                                    {filteredFriends.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                            <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center mb-3">
                                                <UserCheck className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium">No friends found</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {searchQuery.length > 0 ? "Try a different search term." : "Head over to the Add tab to find friends!"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Received Requests Tab */}
                        <TabsContent value="requests" className="flex-1 flex flex-col min-h-0 overflow-hidden m-0 data-[state=active]:flex">
                            <ScrollArea className="flex-1 -mr-3 pr-3 h-full">
                                <div className="space-y-2 pb-4">
                                    {receivedRequests.map(friend => (
                                        <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={friend.avatar_url} />
                                                    <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{friend.username}</p>
                                                    <p className="text-xs text-muted-foreground">Incoming Request</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="icon" className="h-8 w-8 bg-success hover:bg-success/90 text-white" onClick={() => acceptRequest(friend.friendship_id)}>
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="secondary" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => rejectRequest(friend.friendship_id)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {receivedRequests.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                            <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center mb-3">
                                                <UserPlus className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium">No pending requests</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                When someone adds you, it will appear here.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Sent Requests Tab */}
                        <TabsContent value="pending" className="flex-1 flex flex-col min-h-0 overflow-hidden m-0 data-[state=active]:flex">
                            <ScrollArea className="flex-1 -mr-3 pr-3 h-full">
                                <div className="space-y-2 pb-4">
                                    {sentRequests.map(friend => (
                                        <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border/30 opacity-80">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10 grayscale-[30%]">
                                                    <AvatarImage src={friend.avatar_url} />
                                                    <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{friend.username}</p>
                                                    <p className="text-xs text-muted-foreground">Outgoing Request</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline" className="h-8 text-xs hover:text-destructive hover:border-destructive/50" onClick={() => rejectRequest(friend.friendship_id)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    ))}
                                    {sentRequests.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                            <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center mb-3">
                                                <Clock className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium">No sent requests</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Requests you send will stay here until accepted.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* Add Friends Tab */}
                        <TabsContent value="add" className="flex-1 flex flex-col min-h-0 overflow-hidden m-0 data-[state=active]:flex">
                            <div className="relative mb-3 shrink-0">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Find users by username..."
                                    className="h-9 pl-8 bg-secondary/50 border-primary/20 focus-visible:ring-primary/50"
                                    value={globalSearchQuery}
                                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                />
                            </div>
                            <ScrollArea className="flex-1 -mr-3 pr-3 h-full">
                                <div className="space-y-2 pb-4">
                                    {globalSearchQuery.length > 0 ? (
                                        <>
                                            <div className="flex items-center justify-between px-1 mb-2">
                                                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Search Results
                                                </h5>
                                                {isSearchLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                                            </div>
                                            {searchResults && searchResults.length > 0 ? (
                                                searchResults.map(user => {
                                                    const friendStatus = friends.find(f => f.id === user.user_id);
                                                    return (
                                                        <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg bg-card border shadow-sm">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="w-10 h-10 border border-primary/10">
                                                                    <AvatarImage src={user.avatar_url} />
                                                                    <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-sm font-semibold">{user.full_name}</span>
                                                            </div>
                                                            <div>
                                                                {!friendStatus ? (
                                                                    <Button size="sm" className="h-8 gap-1.5" onClick={() => sendRequest.mutate(user.user_id)}>
                                                                        <UserPlus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Add</span>
                                                                    </Button>
                                                                ) : friendStatus.status === 'pending' ? (
                                                                    <Button size="sm" variant="secondary" className="h-8" disabled>
                                                                        Pending
                                                                    </Button>
                                                                ) : (
                                                                    <Button size="sm" variant="outline" className="h-8 text-success border-success/30 bg-success/5" disabled>
                                                                        <Check className="w-3.5 h-3.5 mr-1" /> Friends
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                !isSearchLoading && (
                                                    <div className="text-center py-8">
                                                        <p className="text-sm text-muted-foreground">No users found matching "{globalSearchQuery}"</p>
                                                    </div>
                                                )
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 text-center px-4 h-full border-2 border-dashed border-border/50 rounded-lg mt-2">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                                <Search className="w-6 h-6 text-primary" />
                                            </div>
                                            <p className="text-sm font-medium">Find New Friends</p>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                                Search for a username above to send a friend request.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                    </Tabs>
                </CardContent>
            </Card>

            {/* View Profile Dialog — reuses the same full dialog as the community view */}
            {selectedFriendId && (
                <FullUserProfileDialog
                    userId={selectedFriendId}
                    open={profileDialogOpen}
                    onOpenChange={setProfileDialogOpen}
                />
            )}
        </>
    );
};
