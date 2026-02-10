import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "@/hooks/use-toast";
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
      toast({ title: "Joined!", description: `Spent ${JOIN_COST} B Coins to join.` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const leaveCommunity = useMutation({
    mutationFn: async (communityId: string) => {
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
      toast({ title: "Left community" });
    },
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
      return community;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["my-memberships"] });
      toast({ title: "Community created!", description: `Spent ${CREATE_COST} B Coins.` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
  };
};
