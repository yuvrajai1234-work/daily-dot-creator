import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
    UserPlus,
    MessageSquare,
    MoreHorizontal,
    ShieldAlert,
    Ban,
    Check,
    X,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { useFriendships } from "@/hooks/useSocial";
import { getLevelInfo, getLevelTier } from "@/hooks/useXP";
import { toast } from "sonner";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MemberProfileCardProps {
    userId: string;
    communityId?: string;
    role?: string;
    onClose?: () => void;
}

export const MemberProfileCard = ({ userId, communityId, role, onClose }: MemberProfileCardProps) => {
    const { user: currentUser } = useAuth();
    const { friends, sendRequest, acceptRequest, rejectRequest, isLoading: isFriendsLoading } = useFriendships();

    // Fetch full profile details
    const { data: profileData, isLoading: isProfileLoading } = useQuery({
        queryKey: ["member-profile", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", userId)
                .single();

            if (error) throw error;
            return data;
        },
    });

    // Fetch community join date if communityId is provided
    const { data: communityMember } = useQuery({
        queryKey: ["community-member-details", communityId, userId],
        queryFn: async () => {
            if (!communityId) return null;
            const { data, error } = await supabase
                .from("community_members")
                .select("joined_at")
                .eq("community_id", communityId)
                .eq("user_id", userId)
                .single();

            if (error) return null;
            return data;
        },
        enabled: !!communityId,
    });

    const profile = profileData as any;

    if (isProfileLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    if (!profile) {
        return <div className="p-4 text-center text-muted-foreground">User not found</div>;
    }

    const levelInfo = getLevelInfo({
        level: profile.level || 1,
        current_xp: profile.current_xp || 0,
        total_xp: profile.total_xp || 0
    });

    const tier = getLevelTier(levelInfo.level);

    // Friendship Status
    const isMe = currentUser?.id === userId;
    const friendStatus = friends.find(f => f.id === userId); // Adjust dependent on friend object structure
    // friends array from useFriendships returns { id, status, direction ... } where id is the friend's id.

    const handleSendRequest = () => {
        sendRequest.mutate(userId);
    };

    return (
        <div className="w-80 bg-popover rounded-lg overflow-hidden shadow-xl border border-border">
            {/* Banner */}
            <div
                className="h-24 w-full relative"
                style={{
                    background: profile.banner_url ? `url(${profile.banner_url}) center/cover` : tier.color,
                    opacity: 0.8
                }}
            >
                <div className="absolute top-2 right-2 flex gap-1">
                    {!isMe && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 text-white border-none">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Full Profile</DropdownMenuItem>
                                <DropdownMenuItem>Invite to Server</DropdownMenuItem>
                                <Separator className="my-1" />
                                <DropdownMenuItem className="text-destructive">Block</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Report User Profile</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Profile Info */}
            <div className="px-4 pb-4 relative">
                {/* Avatar */}
                <div className="absolute -top-12 left-4">
                    <div className="relative">
                        <Avatar className="w-20 h-20 border-4 border-popover shadow-sm">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="text-2xl">{profile.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        {/* Online Status Indicator (Mock) */}
                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-popover rounded-full" title="Online"></div>
                    </div>
                </div>

                {/* Badges / Level */}
                <div className="flex justify-end mt-2 mb-1 gap-1 flex-wrap min-h-[20px]">
                    {/* Role Badge */}
                    {role && (
                        <Badge variant="secondary" className="text-xs font-semibold capitalize bg-primary/10 text-primary border-primary/20">
                            {role}
                        </Badge>
                    )}
                    {/* Level Badge */}
                    <Badge
                        variant="outline"
                        className="text-xs font-semibold border-2"
                        style={{ borderColor: tier.color, color: tier.color }}
                    >
                        Level {levelInfo.level}
                    </Badge>
                </div>

                {/* Names */}
                <div className="mt-2">
                    <h3 className="text-lg font-bold leading-tight">{profile.full_name || "Unknown"}</h3>
                    <p className="text-sm text-primary font-medium">{profile.designation || "Student"}</p>
                </div>

                {/* Mutuals / Member Since */}
                <div className="mt-3 text-xs text-muted-foreground flex flex-col gap-1">
                    {communityMember && (
                        <span className="flex items-center gap-1.5">
                            Member since {format(new Date(communityMember.joined_at), "MMM d, yyyy")}
                        </span>
                    )}
                    {/* Placeholder for Mutual Servers */}
                    {/* <span className="flex items-center gap-1.5">
                        <div className="flex -space-x-1">
                           <div className="w-4 h-4 bg-gray-500 rounded-full border border-popover"></div>
                           <div className="w-4 h-4 bg-gray-600 rounded-full border border-popover"></div>
                        </div>
                        2 Mutual Servers
                    </span> */}
                </div>

                <Separator className="my-3" />

                {/* Bio */}
                <div className="text-sm italic mb-4 leading-relaxed text-muted-foreground">
                    "{profile.bio || "10 jan"}"
                </div>

                {/* Tags / Additional Info */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {profile.gender && <Badge variant="secondary" className="text-[10px] h-5">{profile.gender}</Badge>}
                    {profile.location && <Badge variant="secondary" className="text-[10px] h-5">{profile.location}</Badge>}
                </div>

                {/* Action Area */}
                {!isMe && (
                    <div className="space-y-2">
                        {/* Friendship Actions */}
                        {(!friendStatus && !isFriendsLoading) && (
                            <Button
                                className="w-full h-8"
                                variant="secondary"
                                onClick={handleSendRequest}
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Friend
                            </Button>
                        )}

                        {friendStatus?.status === 'pending' && friendStatus.direction === 'sent' && (
                            <Button className="w-full h-8" variant="secondary" disabled>
                                Request Sent
                            </Button>
                        )}

                        {friendStatus?.status === 'pending' && friendStatus.direction === 'received' && (
                            <div className="flex gap-2">
                                <Button className="flex-1 h-8 bg-green-600 hover:bg-green-700" onClick={() => acceptRequest(friendStatus.friendship_id)}>
                                    <Check className="w-4 h-4 mr-1" /> Accept
                                </Button>
                                <Button className="flex-1 h-8 bg-red-600 hover:bg-red-700" onClick={() => rejectRequest(friendStatus.friendship_id)}>
                                    <X className="w-4 h-4 mr-1" /> Ignore
                                </Button>
                            </div>
                        )}

                        {friendStatus?.status === 'accepted' && (
                            <Button className="w-full h-8" variant="outline" disabled>
                                Friends
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
