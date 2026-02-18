import { useState, useEffect } from "react";
import { Community, useCommunityMembers, useCommunities, useChannels } from "@/hooks/useCommunities"; // Imported useChannels
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
    const [showMembers, setShowMembers] = useState(true);

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
        <div className="flex h-full bg-[#1e1e24] -m-4 sm:-m-6 text-gray-100 overflow-hidden">
            <CommunitySettingsDialog
                community={community}
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />

            {/* LEFT SIDEBAR: Channels */}
            <div className="w-[240px] flex flex-col bg-[#2b2d31] flex-shrink-0">
                {/* Header */}
                <div className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 hover:bg-[#35373c] transition-colors cursor-pointer" onClick={onBack}>
                    <h1 className="font-bold truncate text-sm">{community.name}</h1>
                    <div className="flex gap-1">
                        {isAdmin && <Settings className="w-4 h-4 text-gray-400 hover:text-white" onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }} />}
                        <X className="w-4 h-4 text-gray-400 hover:text-white" />
                    </div>
                </div>

                {/* Channel List */}
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-4">
                        {Object.entries(groupedChannels).map(([categoryName, categoryChannels]) => (
                            <div key={categoryName}>
                                <div className="flex items-center justify-between px-2 mb-1 text-xs font-bold text-gray-400 hover:text-gray-300 group/cat cursor-pointer">
                                    <div className="flex items-center gap-0.5">
                                        <ChevronDown className="w-3 h-3" />
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
                                <div className="space-y-0.5">
                                    {categoryChannels.map((channel) => (
                                        <div
                                            key={channel.id}
                                            onClick={() => setActiveChannelId(channel.id)}
                                            className={`group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors ${activeChannelId === channel.id
                                                ? "bg-[#404249] text-white"
                                                : "text-gray-400 hover:bg-[#35373c] hover:text-gray-200"
                                                }`}
                                        >
                                            {channel.type === 'voice' ? (
                                                <Volume2 className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <Hash className="w-4 h-4 text-gray-400" />
                                            )}
                                            <span className="truncate font-medium text-sm">{channel.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* CENTER: Chat Area */}
            <div className="flex-1 flex flex-col bg-[#313338] min-w-0">
                {/* Header */}
                <div className="h-12 border-b border-[#26272d] flex items-center justify-between px-4 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Hash className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <h2 className="font-bold text-white truncate">{activeChannelObj?.name || "Select a channel"}</h2>
                        {activeChannelObj?.category === 'WELCOME' && <span className="text-xs text-yellow-500 font-bold px-2 border border-yellow-500/20 rounded-full bg-yellow-500/10">Read Only</span>}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                        {/* Desktop Member Toggle */}
                        <Users
                            className={`w-5 h-5 cursor-pointer transition-colors hidden lg:block ${showMembers ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                            onClick={() => setShowMembers(!showMembers)}
                            title={showMembers ? "Hide Member List" : "Show Member List"}
                        />
                        <Bell className="w-5 h-5 cursor-pointer hover:text-gray-200" />
                        <Pin className="w-5 h-5 cursor-pointer hover:text-gray-200" />
                        <Users className="w-5 h-5 cursor-pointer hover:text-gray-200 lg:hidden" />
                        <div className="bg-[#1e1f22] flex items-center px-2 py-1 rounded text-sm w-36 overflow-hidden">
                            <input className="bg-transparent border-none outline-none text-gray-200 placeholder-gray-500 w-full" placeholder="Search" />
                            <Search className="w-3 h-3 text-gray-400" />
                        </div>
                        <HelpCircle className="w-5 h-5 cursor-pointer hover:text-gray-200" />
                    </div>
                </div>

                {/* Messages / Content */}
                <div className="flex-1 min-h-0 relative">
                    {activeChannelObj?.name === 'rules' ? (
                        <RulesView />
                    ) : activeChannelObj?.type === 'voice' ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                            <div className="w-16 h-16 rounded-full bg-[#2b2d31] flex items-center justify-center">
                                <Volume2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-semibold">Voice Chat</h3>
                            <p>Voice channels are coming soon!</p>
                        </div>
                    ) : (
                        activeChannelId && <CommunityChat communityId={community.id} channelId={activeChannelId} channelName={activeChannelObj?.name} />
                    )}
                </div>
            </div>

            {/* RIGHT SIDEBAR: Member List (Desktop only) */}
            {
                showMembers && (
                    <div className="w-[240px] bg-[#2b2d31] flex-col hidden lg:flex flex-shrink-0 border-l border-[#1e1f22]">
                        <div className="h-12 border-b border-[#1e1f22] flex items-center px-4 font-bold text-gray-400 text-xs tracking-wider">
                            MEMBERS — {members.length}
                        </div>
                        <ScrollArea className="flex-1 p-3">
                            <div className="space-y-5">
                                {/* Group by Role */}
                                {['admin', 'moderator', 'member'].map(role => {
                                    const roleMembers = sortedMembers.filter((m: any) => m.role === role);
                                    if (roleMembers.length === 0) return null;

                                    const roleLabel = role === 'admin' ? "CHIEF" : role === 'moderator' ? "ELDERS" : "TRIBE MEMBERS";
                                    const roleColor = role === 'admin' ? "text-yellow-500" : role === 'moderator' ? "text-purple-400" : "text-gray-400";

                                    return (
                                        <div key={role}>
                                            <div className={`text-xs font-bold ${roleColor} mb-2 uppercase`}>{roleLabel} — {roleMembers.length}</div>
                                            <div className="space-y-2">
                                                {roleMembers.map((member: any) => {
                                                    const isMe = member.userId === user?.id;
                                                    const friendStatus = !isMe ? getFriendStatus(member.userId) : null;

                                                    return (
                                                        <div key={member.userId} className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#35373c] cursor-pointer opacity-90 hover:opacity-100 transition-all">
                                                            <div className="relative">
                                                                <Avatar className={`w-8 h-8 ${member.role === 'admin' ? 'ring-2 ring-yellow-500/50' : ''}`}>
                                                                    <AvatarImage src={member.avatarUrl} />
                                                                    <AvatarFallback>{member.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#2b2d31] ${isMe ? "bg-green-500" : "bg-gray-500"
                                                                    }`}></div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`text-sm font-medium truncate ${member.role === 'admin' ? 'text-yellow-100' :
                                                                    member.role === 'moderator' ? 'text-purple-100' :
                                                                        'text-gray-300'
                                                                    }`}>
                                                                    {member.username}
                                                                </div>
                                                            </div>

                                                            {!isMe && !friendStatus && (
                                                                <div className="opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); sendRequest.mutate(member.userId); }}>
                                                                    <UserPlus className="w-4 h-4 text-gray-400 hover:text-green-400" />
                                                                </div>
                                                            )}
                                                            {friendStatus?.status === 'pending' && (
                                                                <div title="Request Pending"><Clock className="w-3 h-3 text-yellow-500" /></div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                )
            }
        </div>
    );
};
