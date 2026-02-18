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

export const useCommunityMessages = (communityId: string) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["community-messages", communityId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("community_messages")
                .select(`
          *,
          profile:profiles(username, avatar_url)
        `)
                .eq("community_id", communityId)
                .order("created_at", { ascending: true })
                .limit(50);

            if (error) throw error;
            return data as Message[];
        },
        enabled: !!communityId && !!user,
    });

    // Real-time subscription
    useEffect(() => {
        if (!communityId) return;

        const channel = supabase
            .channel(`community-chat:${communityId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "community_messages",
                    filter: `community_id=eq.${communityId}`,
                },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ["community-messages", communityId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [communityId, queryClient]);

    const sendMessage = useMutation({
        mutationFn: async (content: string) => {
            const { error } = await supabase
                .from("community_messages")
                .insert({
                    community_id: communityId,
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
                .from("friendships")
                .select(`
          id,
          status,
          sender:sender_id(id, username, avatar_url),
          receiver:receiver_id(id, username, avatar_url)
        `)
                .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`);

            if (error) throw error;

            return data.map((f: any) => {
                const isSender = f.sender.id === user!.id;
                const friend = isSender ? f.receiver : f.sender;
                return {
                    id: friend.id,
                    username: friend.username,
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
                .from("friendships")
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
                const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('friendships').update({ status }).eq('id', friendshipId);
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
