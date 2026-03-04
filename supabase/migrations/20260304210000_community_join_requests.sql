-- Join requests table for community membership
CREATE TABLE IF NOT EXISTS public.community_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_join_request UNIQUE (community_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_join_requests' AND policyname = 'Users can view their own requests') THEN
        CREATE POLICY "Users can view their own requests" ON public.community_join_requests
            FOR SELECT USING (
                auth.uid() = user_id
                OR EXISTS (
                    SELECT 1 FROM public.community_members
                    WHERE community_id = community_join_requests.community_id
                    AND user_id = auth.uid()
                    AND role IN ('admin', 'moderator')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_join_requests' AND policyname = 'Authenticated users can create join requests') THEN
        CREATE POLICY "Authenticated users can create join requests" ON public.community_join_requests
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_join_requests' AND policyname = 'Admins can update join requests') THEN
        CREATE POLICY "Admins can update join requests" ON public.community_join_requests
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.community_members
                    WHERE community_id = community_join_requests.community_id
                    AND user_id = auth.uid()
                    AND role IN ('admin', 'moderator')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_join_requests' AND policyname = 'Users can delete own requests') THEN
        CREATE POLICY "Users can delete own requests" ON public.community_join_requests
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable realtime for join requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_join_requests;

-- Index for quick lookup by community
CREATE INDEX IF NOT EXISTS idx_join_requests_community ON public.community_join_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON public.community_join_requests(user_id);
