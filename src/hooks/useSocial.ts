import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import { toast } from "sonner";

export interface Message {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
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

    // To prevent breaking changes, we might need logic.
    // If it's a channelId (UUID), we fetch by channel_id.
    // If it's a communityId (UUID), we potentially fetch legacy?
    // For now, let's assume the UI passes a valid ID and we try both or rely on the caller know what ID it is.
    // But actually, we are shifting to channel-based.
    // Let's rename this hook variable internally to `resourceId`.

    // HOWEVER, to support the transition:
    // If we only query `channel_id`, then `community_id` messages (legacy) won't show.
    // My migration moves everything to `general` channel. So we should query by `channel_id`.

    const channelId = communityIdOrChannelId;

    const query = useQuery({
        queryKey: ["channel-messages", channelId],
        queryFn: async () => {
            // 1. Fetch raw messages (cast to any to avoid type errors for missing tables)
            const { data: messages, error: msgError } = await supabase
                .from("community_messages" as any)
                .select("*")
                .eq("channel_id", channelId)
                .order("created_at", { ascending: true })
                .limit(50);

            if (msgError) throw msgError;
            if (!messages || messages.length === 0) return [];

            // 2. Fetch profiles manually
            const userIds = [...new Set(messages.map((m: any) => m.user_id))];
            const { data: profiles, error: profError } = await supabase
                .from("profiles")
                .select("id, user_id, full_name, avatar_url")
                .in("user_id", userIds);

            if (profError) {
                console.error("Error fetching profiles:", profError);
            }

            const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

            // 3. Combine
            return messages.map((m: any) => ({
                id: m.id,
                content: m.content,
                user_id: m.user_id,
                created_at: m.created_at,
                profile: {
                    username: profileMap.get(m.user_id)?.full_name || 'Unknown',
                    avatar_url: profileMap.get(m.user_id)?.avatar_url || ''
                }
            })) as Message[];
        },
        enabled: !!channelId && !!user,
    });

    // Real-time subscription
    useEffect(() => {
        if (!channelId) return;

        const channel = supabase
            .channel(`channel-chat:${channelId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "community_messages",
                    filter: `channel_id=eq.${channelId}`,
                },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ["channel-messages", channelId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelId, queryClient]);

    const sendMessage = useMutation({
        mutationFn: async ({ content, communityId }: { content: string, communityId: string }) => {
            const { error } = await supabase
                .from("community_messages" as any)
                .insert({
                    community_id: communityId, // Still need this for RLS/Reference? Depends on schema. Schema has both.
                    channel_id: channelId,
                    user_id: user!.id,
                    content,
                });
            if (error) throw error;
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to send message");
        },
    });

    return { ...query, sendMessage };
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
