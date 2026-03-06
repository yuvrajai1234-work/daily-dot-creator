-- Migration to support Profile Visibility (Public, Group Only, Private)
-- and functional Friend Requests based on those settings.

-- 1. Add profile_visibility and other community settings to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_visibility TEXT CHECK (profile_visibility IN ('public', 'group', 'private')) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS show_on_leaderboard BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS group_discovery BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_streak BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_level BOOLEAN DEFAULT true;

-- 2. Ensure default is public for all
UPDATE public.profiles SET profile_visibility = 'public' WHERE profile_visibility IS NULL;

-- 3. Helper function for grouped visibility check
CREATE OR REPLACE FUNCTION check_shared_community(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.community_members m1
        JOIN public.community_members m2 ON m1.community_id = m2.community_id
        WHERE m1.user_id = user_a
        AND m2.user_id = user_b
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Friendships RLS to enforce visibility
-- Current Insert Policy: Authenticated users can send friend requests (auth.uid() = sender_id)
-- We need to drop the old policy and create a more restrictive one.

DO $$
BEGIN
    -- Drop existing insert policy
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Authenticated users can send friend requests') THEN
        DROP POLICY "Authenticated users can send friend requests" ON public.friendships;
    END IF;

    -- Create new restrictive insert policy
    -- A user can send a friend request ONLY IF:
    -- 1. Receiver is PUBLIC
    -- 2. Receiver is GROUP ONLY AND they share at least one community
    -- 3. (Private is implicitly handled as no other case matches)
    CREATE POLICY "Allowed users can send friend requests" ON public.friendships 
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = public.friendships.receiver_id
            AND (
                p.profile_visibility = 'public'
                OR (
                    p.profile_visibility = 'group'
                    AND EXISTS (
                        SELECT 1 FROM public.community_members m1
                        JOIN public.community_members m2 ON m1.community_id = m2.community_id
                        WHERE m1.user_id = auth.uid()
                        AND m2.user_id = p.user_id
                    )
                )
            )
        )
    );

END $$;
