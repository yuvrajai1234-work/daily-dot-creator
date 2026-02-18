import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export const usePinnedMessages = (channelId: string) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["pinned-messages", channelId],
        queryFn: async () => {
            const { data: messages, error } = await supabase
                .from("community_messages" as any)
                .select("*, profile:profiles(username, avatar_url)")
                .eq("channel_id", channelId)
                .eq("is_pinned", true)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Map to match Message interface roughly, or simpler type
            return messages.map((m: any) => ({
                id: m.id,
                content: m.content,
                user_id: m.user_id,
                created_at: m.created_at,
                profile: { // Handle if profile is joined or fetched separately. Joined is nicer if it works.
                    username: m.profile?.username || 'Unknown',
                    avatar_url: m.profile?.avatar_url || ''
                }
            }));
        },
        enabled: !!channelId && !!user,
    });
};
