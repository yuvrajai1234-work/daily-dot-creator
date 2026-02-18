import { useState, useEffect } from "react";
import { Community, useCommunityMembers, useCommunities, useChannels } from "@/hooks/useCommunities";
import { usePinnedMessages } from "@/hooks/usePinnedMessages";
import { MemberProfileCard } from "./MemberProfileCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CommunityChat } from "./CommunityChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Hash,
    Volume2,
    ChevronDown,
    Settings,
    Users,
    UserPlus,
    Clock,
    X,
    Check,
    ShieldCheck,
    Search,
    Bell,
    Pin,
    HelpCircle,
    Plus
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useFriendships } from "@/hooks/useSocial";
import { CommunitySettingsDialog } from "./CommunitySettingsDialog";
import { toast } from "sonner";

interface CommunityDetailViewProps {
    community: Community;
    onBack: () => void;
}

export const CommunityDetailView = ({ community, onBack }: CommunityDetailViewProps) => {
    const { user } = useAuth();
    const { data: members = [], isLoading: membersLoading } = useCommunityMembers(community.id);
    const { friends, sendRequest, isLoading: friendsLoading } = useFriendships();
    const { leaveCommunity } = useCommunities();
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Fetch Channels
    const { data: channels = [], isLoading: channelsLoading, createChannel } = useChannels(community.id);
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const { data: pinnedMessages = [] } = usePinnedMessages(activeChannelId || "");
    const [showMembers, setShowMembers] = useState(true);

    // Collapsed state
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Set default channel when channels load
    useEffect(() => {
        if (channels.length > 0 && !activeChannelId) {
            const general = channels.find(c => c.name === 'general' && c.type === 'text');
            if (general) {
                setActiveChannelId(general.id);
            } else {
                setActiveChannelId(channels[0].id);
            }
        }
    }, [channels, activeChannelId]);

    // Find my role
    const myMember = members.find((m: any) => m.userId === user?.id);
    const isAdmin = myMember?.role === 'admin';
    const isModerator = myMember?.role === 'moderator';
    const canManageChannels = isAdmin || isModerator;

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

    // Sort members
    const sortedMembers = [...members].sort((a: any, b: any) => {
        const roleOrder = { admin: 0, moderator: 1, member: 2 };
        return (roleOrder[a.role as keyof typeof roleOrder] || 2) - (roleOrder[b.role as keyof typeof roleOrder] || 2);
    });

    // Group channels by category
    const groupedChannels = {
        'WELCOME': channels.filter(c => c.category === 'WELCOME'),
        'TEXT CHANNELS': channels.filter(c => c.category === 'TEXT CHANNELS'),
        'VOICE CHANNELS': channels.filter(c => c.category === 'VOICE CHANNELS'),
    };

    // Handle Create Channel
    const handleCreateChannel = (category: string, type: 'text' | 'voice') => {
        const name = prompt(`Enter name for new ${type} channel in ${category}:`);
        if (name) {
            createChannel.mutate({
                community_id: community.id,
                name: name.toLowerCase().replace(/\s+/g, '-'),
                type,
                category
            });
        }
    }

    const activeChannelObj = channels.find(c => c.id === activeChannelId);

    // Rules View Component (Inline)
    const RulesView = () => (
        <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="max-w-2xl w-full bg-[#2b2d31] rounded-lg p-6 shadow-xl border-l-4 border-yellow-500 text-left">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-2xl">
                        {community.emoji}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Welcome to {community.name}</h3>
                        <p className="text-gray-400 text-sm">Est. {new Date(community.created_at).getFullYear()}</p>
                    </div>
                </div>

                <div className="space-y-4 text-gray-300">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-yellow-500 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5" /> Community Rules
                        </p>
                        {isAdmin && <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => alert("Edit rules feature coming soon!")}>Edit</Button>}
                    </div>

                    <div className="bg-[#1e1f22] p-4 rounded border border-gray-700 space-y-3">
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">1.</span>
                            <p className="text-sm">Be respectful to all members. Harassment is not tolerated.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">2.</span>
                            <p className="text-sm">Keep discussions relevant to the channel topic.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="font-bold text-gray-400">3.</span>
                            <p className="text-sm">No spamming or self-promotion without permission.</p>
                        </div>
                    </div>

                    <p className="text-sm italic text-gray-500 mt-4">
                        By staying in this server, you agree to follow these rules.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-full bg-background -m-4 sm:-m-6 text-foreground overflow-hidden">
            <CommunitySettingsDialog
                community={community}
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />

            {/* LEFT SIDEBAR: Channels */}
            <div className="w-[240px] flex flex-col bg-card border-r border-border flex-shrink-0">
                {/* Header */}
                <div className="h-12 border-b border-border flex items-center justify-between px-4 hover:bg-accent transition-colors cursor-pointer" onClick={onBack}>
                    <h1 className="font-bold truncate text-sm text-foreground">{community.name}</h1>
                    <div className="flex gap-1">
                        {isAdmin && <Settings className="w-4 h-4 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }} />}
                        <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </div>
                </div>

                {/* Channel List */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-4">
                        {Object.entries(groupedChannels).map(([categoryName, categoryChannels]) => {
                            const isCollapsed = collapsedCategories[categoryName];
                            return (
                                <div key={categoryName}>
                                    <div
                                        className="flex items-center justify-between px-2 mb-1 text-xs font-bold text-gray-400 hover:text-gray-300 group/cat cursor-pointer select-none"
                                        onClick={() => toggleCategory(categoryName)}
                                    >
                                        <div className="flex items-center gap-0.5">
                                            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                                            {categoryName}
                                        </div>
                                        {canManageChannels && categoryName !== 'WELCOME' && (
                                            <Plus
                                                className="w-4 h-4 opacity-0 group-hover/cat:opacity-100 hover:text-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCreateChannel(categoryName, categoryName === 'VOICE CHANNELS' ? 'voice' : 'text');
                                                }}
                                            />
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                            {categoryChannels.map((channel) => (
                                                <div
                                                    key={channel.id}
                                                    onClick={() => setActiveChannelId(channel.id)}
                                                    className={`group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors ${activeChannelId === channel.id
                                                        ? "bg-primary/20 text-primary font-semibold"
                                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                        }`}
                                                >
                                                    {channel.type === 'voice' ? (
                                                        <Volume2 className={`w-4 h-4 ${activeChannelId === channel.id ? "text-primary" : "text-muted-foreground"}`} />
                                                    ) : (
                                                        <Hash className={`w-4 h-4 ${activeChannelId === channel.id ? "text-primary" : "text-muted-foreground"}`} />
                                                    )}
                                                    <span className="truncate font-medium text-sm">{channel.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </div>

            {/* CENTER: Chat Area */}
            <div className="flex-1 flex flex-col bg-background min-w-0">
                {/* Header */}
                <div className="h-12 border-b border-border flex items-center justify-between px-4 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {/* Removed Hash icon */}
                        <h2 className="font-bold text-foreground truncate">{activeChannelObj?.name || "Select a channel"}</h2>
                        {activeChannelObj?.category === 'WELCOME' && <span className="text-xs text-yellow-500 font-bold px-2 border border-yellow-500/20 rounded-full bg-yellow-500/10">Read Only</span>}
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                        {/* Desktop Member Toggle */}
                        <div title={showMembers ? "Hide Member List" : "Show Member List"}>
                            <Users
                                className={`w-5 h-5 cursor-pointer transition-colors hidden lg:block ${showMembers ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setShowMembers(!showMembers)}
                            />
                        </div>
                        <Bell className="w-5 h-5 cursor-pointer hover:text-foreground" />
                        <Bell className="w-5 h-5 cursor-pointer hover:text-foreground" />
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="relative cursor-pointer group">
                                    <Pin className="w-5 h-5 group-hover:text-foreground" />
                                    {pinnedMessages.length > 0 && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[8px] text-white"></span>}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                                <div className="p-3 font-semibold border-b bg-muted/40 text-sm">Pinned Messages</div>
                                <ScrollArea className="h-64">
                                    {pinnedMessages.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            No pinned messages in this channel.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            {pinnedMessages.map((msg: any) => (
                                                <div key={msg.id} className="p-3 border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Avatar className="w-5 h-5">
                                                            <AvatarImage src={msg.profile?.avatar_url} />
                                                            <AvatarFallback>{msg.profile?.username?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-bold text-foreground">{msg.profile?.username}</span>
                                                        <span className="text-[10px] text-muted-foreground ml-auto">
                                                            {new Date(msg.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-foreground/90 pl-7 break-words">
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                        <Users className="w-5 h-5 cursor-pointer hover:text-foreground lg:hidden" />
                        <div className="bg-secondary/50 flex items-center px-2 py-1 rounded text-sm w-36 overflow-hidden">
                            <input className="bg-transparent border-none outline-none text-foreground placeholder-muted-foreground w-full" placeholder="Search" />
                            <Search className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <HelpCircle className="w-5 h-5 cursor-pointer hover:text-foreground" />
                    </div>
                </div>

                {/* Messages / Content */}
                <div className="flex-1 min-h-0 relative">
                    {activeChannelObj?.name === 'rules' ? (
                        <RulesView />
                    ) : activeChannelObj?.type === 'voice' ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
                                <Volume2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold">Voice Chat</h3>
                            <p>Voice channels are coming soon!</p>
                        </div>
                    ) : (
                        activeChannelId && <CommunityChat communityId={community.id} channelId={activeChannelId} channelName={activeChannelObj?.name} members={members} />
                    )}
                </div>
            </div>

            {/* RIGHT SIDEBAR: Member List (Desktop only) */}
            {showMembers && (
                <div className="w-[240px] bg-card flex-col hidden lg:flex flex-shrink-0 border-l border-border">
                    <div className="h-12 border-b border-border flex items-center px-4 font-bold text-muted-foreground text-xs tracking-wider">
                        MEMBERS — {members.length}
                    </div>
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-5">
                            {/* Group by Role */}
                            {['admin', 'moderator', 'member'].map(role => {
                                const roleMembers = sortedMembers.filter((m: any) => m.role === role);
                                if (roleMembers.length === 0) return null;

                                const roleLabel = role === 'admin' ? "CHIEF" : role === 'moderator' ? "ELDERS" : "TRIBE MEMBERS";
                                const roleColor = role === 'admin' ? "text-yellow-500" : role === 'moderator' ? "text-purple-400" : "text-muted-foreground";

                                return (
                                    <div key={role}>
                                        <div className={`text-xs font-bold ${roleColor} mb-2 uppercase`}>{roleLabel} — {roleMembers.length}</div>
                                        <div className="space-y-2">
                                            {roleMembers.map((member: any) => {
                                                const isMe = member.userId === user?.id;
                                                const friendStatus = !isMe ? getFriendStatus(member.userId) : null;

                                                return (
                                                    <Popover key={member.userId}>
                                                        <PopoverTrigger asChild>
                                                            <div className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer opacity-90 hover:opacity-100 transition-all">
                                                                <div className="relative">
                                                                    <Avatar className={`w-8 h-8 ${member.role === 'admin' ? 'ring-2 ring-yellow-500/50' : ''}`}>
                                                                        <AvatarImage src={member.avatarUrl} />
                                                                        <AvatarFallback>{member.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${isMe ? "bg-green-500" : "bg-muted-foreground"
                                                                        }`}></div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={`text-sm font-medium truncate ${member.role === 'admin' ? 'text-yellow-500' :
                                                                        member.role === 'moderator' ? 'text-purple-400' :
                                                                            'text-foreground'
                                                                        }`}>
                                                                        {member.username}
                                                                    </div>
                                                                </div>

                                                                {!isMe && !friendStatus && (
                                                                    <div className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); sendRequest.mutate(member.userId); }}>
                                                                        <UserPlus className="w-4 h-4 text-muted-foreground hover:text-green-400" />
                                                                    </div>
                                                                )}
                                                                {friendStatus?.status === 'pending' && (
                                                                    <div title="Request Pending"><Clock className="w-3 h-3 text-yellow-500" /></div>
                                                                )}
                                                            </div>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="left" align="start">
                                                            <MemberProfileCard
                                                                userId={member.userId}
                                                                communityId={community.id}
                                                                role={member.role}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
};
