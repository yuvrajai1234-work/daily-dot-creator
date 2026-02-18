import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useSpendBCoins } from "@/hooks/useCoins";

export interface Community {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  habit_category: string;
  created_by: string;
  created_at: string;
  member_count?: number;
  rules_content?: string;
}

export interface Channel {
  id: string;
  community_id: string;
  name: string;
  type: 'text' | 'voice';
  category: string;
  is_readonly: boolean;
}

export const JOIN_COST = 10;
export const CREATE_COST = 20;

export const useCommunities = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const spendBCoins = useSpendBCoins();

  const communitiesQuery = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get member counts
      const { data: members, error: membersError } = await supabase
        .from("community_members")
        .select("community_id");
      if (membersError) throw membersError;

      const counts: Record<string, number> = {};
      members?.forEach((m: { community_id: string }) => {
        counts[m.community_id] = (counts[m.community_id] || 0) + 1;
      });

      return (data as Community[]).map((c) => ({
        ...c,
        member_count: counts[c.id] || 0,
      }));
    },
    enabled: !!user,
  });

  const myMembershipsQuery = useQuery({
    queryKey: ["my-memberships", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id, role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as { community_id: string; role: string }[];
    },
    enabled: !!user,
  });

  const joinCommunity = useMutation({
    mutationFn: async (communityId: string) => {
      // Deduct B coins first
      await spendBCoins.mutateAsync({ amount: JOIN_COST, reason: "Join community" });
      const { error } = await supabase
        .from("community_members")
        .insert({ community_id: communityId, user_id: user!.id, role: "member" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["my-memberships"] });
      toast.success(`Joined! Spent ${JOIN_COST} B Coins.`);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const leaveCommunity = useMutation({
    mutationFn: async (communityId: string) => {
      // First retrieve user role to handle creator case if necessary, but skipping for now
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["my-memberships"] });
      toast.success("Left community");
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const createCommunity = useMutation({
    mutationFn: async (data: { name: string; tagline: string; emoji: string; habit_category: string }) => {
      // Deduct B coins first
      await spendBCoins.mutateAsync({ amount: CREATE_COST, reason: "Create community" });
      const { data: community, error } = await supabase
        .from("communities")
        .insert({ ...data, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      // Auto-join as admin
      await supabase
        .from("community_members")
        .insert({ community_id: community.id, user_id: user!.id, role: "admin" });

      // Channels are created by Database Trigger (handle_new_community)

      return community;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["my-memberships"] });
      toast.success(`Community created! Spent ${CREATE_COST} B Coins.`);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const updateCommunity = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; tagline?: string; emoji?: string; habit_category?: string; rules_content?: string }) => {
      const { error } = await supabase
        .from("communities")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("Community updated!");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ communityId, userId, role }: { communityId: string; userId: string; role: 'admin' | 'moderator' | 'member' }) => {
      const { error } = await supabase
        .from("community_members")
        .update({ role })
        .eq("community_id", communityId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["community-members", vars.communityId] });
      toast.success("Member role updated!");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const kickMember = useMutation({
    mutationFn: async ({ communityId, userId }: { communityId: string; userId: string }) => {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["community-members", vars.communityId] });
      toast.success("Member removed");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const isMember = (communityId: string) =>
    myMembershipsQuery.data?.some((m) => m.community_id === communityId) ?? false;

  return {
    communities: communitiesQuery.data ?? [],
    isLoading: communitiesQuery.isLoading,
    myMemberships: myMembershipsQuery.data ?? [],
    isMember,
    joinCommunity,
    leaveCommunity,
    createCommunity,
    updateCommunity,
    updateMemberRole,
    kickMember,
  };
};

export const useCommunityMembers = (communityId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["community-members", communityId],
    queryFn: async () => {
      // 1. Fetch raw members data
      const { data: members, error: memError } = await supabase
        .from("community_members" as any)
        .select("user_id, role")
        .eq("community_id", communityId);

      if (memError) throw memError;
      if (!members || members.length === 0) return [];

      // 2. Fetch profiles for these members
      const userIds = members.map((m: any) => m.user_id);
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (profError) {
        console.error("Error fetching member profiles:", profError);
      }

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      // 3. Combine data
      return members.map((m: any) => ({
        userId: m.user_id,
        role: m.role,
        username: profileMap.get(m.user_id)?.full_name || "Unknown member",
        avatarUrl: profileMap.get(m.user_id)?.avatar_url,
      }));
    },
    enabled: !!communityId && !!user,
  });
};

export const useChannels = (communityId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["channels", communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channels" as any)
        .select("*")
        .eq("community_id", communityId)
        .order("created_at", { ascending: true });

      if (error) {
        // If table doesn't exist yet (migration pending), return default structure mocked
        console.error("Error fetching channels (migration might be missing):", error);
        return [];
      }
      return data as Channel[];
    },
    enabled: !!communityId && !!user,
  });

  const createChannel = useMutation({
    mutationFn: async (channel: { community_id: string; name: string; type: 'text' | 'voice'; category: string }) => {
      const { error } = await supabase
        .from("channels" as any)
        .insert(channel);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", communityId] });
      toast.success("Channel created");
    },
    onError: (e: any) => toast.error(e.message)
  });

  const deleteChannel = useMutation({
    mutationFn: async (channelId: string) => {
      const { error } = await supabase.from("channels" as any).delete().eq('id', channelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", communityId] });
      toast.success("Channel deleted");
    },
  });

  return { ...query, createChannel, deleteChannel };
}
