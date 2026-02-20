import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import { toast } from "sonner";

export interface MessageReaction {
    id: string;
    emoji: string;
    user_id: string;
    profile?: {
        username: string;
        avatar_url: string;
    };
}

export interface Message {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    is_pinned?: boolean;
    reply_to_id?: string;
    reactions?: MessageReaction[];
    profile?: {
        username: string;
        avatar_url: string;
    };
}

export interface Friend {
    id: string; // The friend's user_id
    friendship_id: string;
    username: string;
    avatar_url: string;
    status: 'pending' | 'accepted';
    direction: 'sent' | 'received';
}

export const useCommunityMessages = (communityIdOrChannelId: string) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const channelId = communityIdOrChannelId;

    const query = useQuery({
        queryKey: ["channel-messages", channelId],
        queryFn: async () => {
            // 1. Fetch raw messages
            const { data: messages, error: msgError } = await supabase
                .from("community_messages" as any)
                .select("*")
                .eq("channel_id", channelId)
                .order("created_at", { ascending: true })
                .limit(50);

            if (msgError) throw msgError;
            if (!messages || messages.length === 0) return [];

            const messageIds = messages.map((m: any) => m.id);

            // 2. Fetch profiles
            const { data: reactionData } = await supabase
                .from("message_reactions" as any)
                .select("*")
                .in("message_id", messageIds);

            const allUserIds = new Set([
                ...messages.map((m: any) => m.user_id),
                ...(reactionData || []).map((r: any) => r.user_id)
            ]);

            const { data: profiles, error: profError } = await supabase
                .from("profiles" as any)
                .select("id, user_id, full_name, avatar_url")
                .in("user_id", Array.from(allUserIds));

            if (profError) {
                console.error("Error fetching profiles:", profError);
            }
            const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

            // 3. (Reactions already fetched above to get user IDs)
            // const { data: reactions, error: reactError } = await supabase ... (Removed redundant call)
            const reactions = reactionData || [];

            // 4. Combine
            return messages.map((m: any) => ({
                id: m.id,
                content: m.content,
                user_id: m.user_id,
                created_at: m.created_at,
                is_pinned: m.is_pinned,
                reply_to_id: m.reply_to_id,
                reactions: (reactions as any[])
                    ?.filter((r: any) => r.message_id === m.id)
                    .map((r: any) => ({
                        ...r,
                        profile: {
                            username: profileMap.get(r.user_id)?.full_name || 'Unknown',
                            avatar_url: profileMap.get(r.user_id)?.avatar_url || ''
                        }
                    })) || [],
                profile: {
                    username: profileMap.get(m.user_id)?.full_name || 'Unknown',
                    avatar_url: profileMap.get(m.user_id)?.avatar_url || ''
                }
            })) as Message[];
        },
        enabled: !!channelId && !!user,
    });

    // Real-time subscription (expanded to listen to reactions too if possible, but for MVP just messages)
    // To listen to reactions we need another channel or wildcard
    useEffect(() => {
        if (!channelId) return;

        const channel = supabase
            .channel(`channel-chat:${channelId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "community_messages",
                    filter: `channel_id=eq.${channelId}`,
                },
                () => queryClient.invalidateQueries({ queryKey: ["channel-messages", channelId] })
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "message_reactions" },
                (payload) => {
                    // Invalidate if the reaction belongs to one of our messages?
                    // Hard to filter without message_id in filter, so just invalidate
                    queryClient.invalidateQueries({ queryKey: ["channel-messages", channelId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelId, queryClient]);

    const sendMessage = useMutation({
        mutationFn: async ({ content, communityId, replyToId }: { content: string, communityId: string, replyToId?: string }) => {
            const { error } = await supabase
                .from("community_messages" as any)
                .insert({
                    community_id: communityId,
                    channel_id: channelId,
                    user_id: user!.id,
                    content,
                    reply_to_id: replyToId
                });
            if (error) throw error;
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to send message");
        },
    });

    const pinMessage = useMutation({
        mutationFn: async ({ messageId, isPinned }: { messageId: string, isPinned: boolean }) => {
            const { error } = await supabase
                .from("community_messages" as any)
                .update({ is_pinned: isPinned })
                .eq("id", messageId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["channel-messages", channelId] });
            queryClient.invalidateQueries({ queryKey: ["pinned-messages", channelId] });
            toast.success("Message pinned/unpinned");
        },
        onError: (error: any) => {
            toast.error("Failed to pin message: " + error.message);
        }
    });

    const addReaction = useMutation({
        mutationFn: async ({ messageId, emoji }: { messageId: string, emoji: string }) => {
            const { error } = await supabase
                .from("message_reactions" as any)
                .insert({
                    message_id: messageId,
                    user_id: user!.id,
                    emoji
                });
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["channel-messages", channelId] })
    });

    const deleteMessage = useMutation({
        mutationFn: async (messageId: string) => {
            const { error } = await supabase
                .from("community_messages" as any)
                .delete()
                .eq("id", messageId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Message deleted");
            queryClient.invalidateQueries({ queryKey: ["channel-messages", channelId] });
        },
        onError: (error: any) => {
            toast.error("Failed to delete message: " + error.message);
        }
    });

    return { ...query, sendMessage, pinMessage, addReaction, deleteMessage };
};

export const useFriendships = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch friends (accepted only for now, or all?)
    const friendsQuery = useQuery({
        queryKey: ["friends", user?.id],
        queryFn: async () => {
            // Fetch where user is sender or receiver
            const { data, error } = await supabase
                .from("friendships" as any)
                .select(`
          id,
          status,
          sender:sender_id(id, full_name, avatar_url),
          receiver:receiver_id(id, full_name, avatar_url)
        `)
                .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`);

            if (error) throw error;

            return data.map((f: any) => {
                const isSender = f.sender.id === user!.id;
                const friend = isSender ? f.receiver : f.sender;
                return {
                    id: friend.id,
                    username: friend.full_name, // Map full_name to username
                    avatar_url: friend.avatar_url,
                    status: f.status,
                    friendship_id: f.id,
                    direction: isSender ? 'sent' : 'received',
                } as Friend;
            });
        },
        enabled: !!user,
    });

    const sendRequest = useMutation({
        mutationFn: async (friendId: string) => {
            const { error } = await supabase
                .from("friendships" as any)
                .insert({
                    sender_id: user!.id,
                    receiver_id: friendId,
                    status: 'pending'
                });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Friend request sent!");
            queryClient.invalidateQueries({ queryKey: ["friends"] });
        },
        onError: (error: any) => {
            if (error.code === '23505') { // Unique violation
                toast.info("Friend request already sent or exists.");
            } else {
                toast.error(error.message || "Failed to add friend");
            }
        }
    });

    const updateStatus = useMutation({
        mutationFn: async ({ friendshipId, status }: { friendshipId: string; status: 'accepted' | 'rejected' }) => {
            if (status === 'rejected') {
                const { error } = await supabase.from('friendships' as any).delete().eq('id', friendshipId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('friendships' as any).update({ status }).eq('id', friendshipId);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["friends"] });
            toast.success("Updated friend status");
        },
    });

    const acceptRequest = (friendshipId: string) => updateStatus.mutate({ friendshipId, status: 'accepted' });
    const rejectRequest = (friendshipId: string) => updateStatus.mutate({ friendshipId, status: 'rejected' });

    return {
        friends: friendsQuery.data ?? [],
        isLoading: friendsQuery.isLoading,
        sendRequest,
        acceptRequest,
        rejectRequest,
        updateStatus
    };
};

export interface NotificationMessage extends Message {
    type: 'mention' | 'reply';
    channel_name?: string;
}

export const useCommunityNotifications = (communityId: string) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ["community-notifications", communityId, user?.id],
        queryFn: async () => {
            if (!user) return [];

            // 1. Get user profile for username
            const { data: profileData } = await supabase
                .from("profiles" as any)
                .select("full_name")
                .eq("user_id", user.id)
                .single();

            const profile = profileData as any;
            const username = profile?.full_name || "";

            // 2. Get my recent message IDs for reply check
            const { data: myMessages } = await supabase
                .from("community_messages" as any)
                .select("id")
                .eq("user_id", user.id)
                .eq("community_id", communityId)
                .order("created_at", { ascending: false })
                .limit(50);

            const myMessageIds = myMessages?.map((m: any) => m.id) || [];

            // 3. Fetch notifications (mentions or replies)
            // We'll do two parallel queries and merge
            const mentionsPromise = username ? supabase
                .from("community_messages" as any)
                .select("*, channels:channel_id(name)") // Mocking channel join if possible, or just fetch all
                .eq("community_id", communityId)
                .ilike("content", `%@${username}%`)
                .order("created_at", { ascending: false })
                .limit(20) : Promise.resolve({ data: [] });

            const repliesPromise = myMessageIds.length > 0 ? supabase
                .from("community_messages" as any)
                .select("*, channels:channel_id(name)")
                .eq("community_id", communityId)
                .in("reply_to_id", myMessageIds)
                .order("created_at", { ascending: false })
                .limit(20) : Promise.resolve({ data: [] });

            const [mentionsResult, repliesResult] = await Promise.all([mentionsPromise, repliesPromise]);

            const mentions = (mentionsResult.data || []).map((m: any) => ({ ...m, type: 'mention' }));
            const replies = (repliesResult.data || []).map((m: any) => ({ ...m, type: 'reply' }));

            // Merge and dedup
            const all = [...mentions, ...replies];
            const unique = Array.from(new Map(all.map(item => [item.id, item])).values());

            // Sort by created_at desc
            return unique.sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ) as NotificationMessage[];
        },
        enabled: !!user && !!communityId,
        refetchInterval: 30000 // Poll every 30s
    });
};
