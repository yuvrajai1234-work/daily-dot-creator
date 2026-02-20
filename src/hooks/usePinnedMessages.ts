import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export const usePinnedMessages = (channelId: string) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["pinned-messages", channelId],
        queryFn: async () => {
            // 1. Fetch pinned messages
            const { data: messages, error: msgError } = await supabase
                .from("community_messages" as any)
                .select("*")
                .eq("channel_id", channelId)
                .eq("is_pinned", true)
                .order("created_at", { ascending: true }); // Oldest at top of query result, so latest is last?

            if (msgError) throw msgError;
            if (!messages || messages.length === 0) return [];

            // 2. Fetch profiles
            const userIds = [...new Set(messages.map((m: any) => m.user_id))];
            const { data: profiles, error: profError } = await supabase
                .from("profiles" as any)
                .select("user_id, full_name, avatar_url")
                .in("user_id", userIds);

            if (profError) console.error("Error fetching profiles:", profError);

            const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

            return messages.map((m: any) => ({
                id: m.id,
                content: m.content,
                user_id: m.user_id,
                created_at: m.created_at,
                is_pinned: true,
                profile: {
                    username: profileMap.get(m.user_id)?.full_name || 'Unknown',
                    avatar_url: profileMap.get(m.user_id)?.avatar_url || ''
                }
            }));
        },
        enabled: !!channelId && !!user,
    });
};
