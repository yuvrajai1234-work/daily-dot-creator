-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    emoji TEXT DEFAULT '🎯',
    habit_category TEXT DEFAULT 'General',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- 2. Community Members Table
CREATE TABLE IF NOT EXISTS public.community_members (
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('member', 'moderator', 'admin')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (community_id, user_id)
);

-- Enable RLS on community_members
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- 3. Community Messages Table
CREATE TABLE IF NOT EXISTS public.community_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on community_messages
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- 4. Friendships Table
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_friend_request UNIQUE (sender_id, receiver_id)
);

-- Enable RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;


-- 5. POLICIES (Using DO blocks to avoid "already exists" errors)

DO $$ 
BEGIN
    -- Communities Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Communities are viewable by everyone') THEN
        CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Authenticated users can create communities') THEN
        CREATE POLICY "Authenticated users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Creators can update their communities') THEN
        CREATE POLICY "Creators can update their communities" ON public.communities FOR UPDATE USING (auth.uid() = created_by);
    END IF;

    -- Community Members Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Community members are viewable by everyone') THEN
        CREATE POLICY "Community members are viewable by everyone" ON public.community_members FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Authenticated users can join communities') THEN
        CREATE POLICY "Authenticated users can join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Members can leave own community') THEN
        CREATE POLICY "Members can leave own community" ON public.community_members FOR DELETE USING (auth.uid() = user_id);
    END IF;
    
    -- Community Messages Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_messages' AND policyname = 'Members can view messages') THEN
        CREATE POLICY "Members can view messages" ON public.community_messages FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.community_members 
                WHERE community_id = public.community_messages.community_id 
                AND user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_messages' AND policyname = 'Members can insert messages') THEN
        CREATE POLICY "Members can insert messages" ON public.community_messages FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.community_members 
                WHERE community_id = public.community_messages.community_id 
                AND user_id = auth.uid()
            )
        );
    END IF;

    -- Friendships Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can view their friendships') THEN
        CREATE POLICY "Users can view their friendships" ON public.friendships FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Authenticated users can send friend requests') THEN
        CREATE POLICY "Authenticated users can send friend requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can update their own received requests (accept/reject)') THEN
        CREATE POLICY "Users can update their own received requests (accept/reject)" ON public.friendships FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can delete their friendships') THEN
        CREATE POLICY "Users can delete their friendships" ON public.friendships FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    END IF;

END $$;

-- Create indexes for performance (IF NOT EXISTS is safe here)
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_community_id ON public.community_messages(community_id);
CREATE INDEX IF NOT EXISTS idx_friendships_sender_id ON public.friendships(sender_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver_id ON public.friendships(receiver_id);
