-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Channels Table
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('text', 'voice')) DEFAULT 'text',
    category TEXT DEFAULT 'TEXT CHANNELS', -- 'WELCOME', 'TEXT CHANNELS', 'VOICE CHANNELS'
    is_readonly BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Policies for channels
CREATE POLICY "Members can view channels" 
ON public.channels FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.community_members 
        WHERE community_id = public.channels.community_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins and Moderators can create/update/delete channels" 
ON public.channels FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.community_members 
        WHERE community_id = public.channels.community_id 
        AND user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
);

-- 2. Update Community Messages to support Channels
-- Add channel_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_messages' AND column_name = 'channel_id') THEN
        ALTER TABLE public.community_messages ADD COLUMN channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Trigger to create default channels for NEW communities
CREATE OR REPLACE FUNCTION public.handle_new_community()
RETURNS TRIGGER AS $$
DECLARE
    gen_id UUID;
BEGIN
    -- 1. Create 'rules' channel (Welcome category)
    INSERT INTO public.channels (community_id, name, type, category, is_readonly)
    VALUES (NEW.id, 'rules', 'text', 'WELCOME', true);

    -- 2. Create 'general' channel (Text Channels)
    INSERT INTO public.channels (community_id, name, type, category, is_readonly)
    VALUES (NEW.id, 'general', 'text', 'TEXT CHANNELS', false)
    RETURNING id INTO gen_id;

    -- 3. Create 'Lounge' channel (Voice Channels)
    INSERT INTO public.channels (community_id, name, type, category, is_readonly)
    VALUES (NEW.id, 'Lounge', 'voice', 'VOICE CHANNELS', false);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger setup
DROP TRIGGER IF EXISTS on_community_created ON public.communities;
CREATE TRIGGER on_community_created
    AFTER INSERT ON public.communities
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_community();

-- 4. Backfill Script for EXISTING communities (Idempotent)
DO $$
DECLARE
    comm RECORD;
    gen_id UUID;
    existing_gen UUID;
BEGIN
    FOR comm IN SELECT * FROM public.communities LOOP
        -- Check/Create Rules
        IF NOT EXISTS (SELECT 1 FROM public.channels WHERE community_id = comm.id AND name = 'rules') THEN
            INSERT INTO public.channels (community_id, name, type, category, is_readonly)
            VALUES (comm.id, 'rules', 'text', 'WELCOME', true);
        END IF;

        -- Check/Create Lounge
        IF NOT EXISTS (SELECT 1 FROM public.channels WHERE community_id = comm.id AND name = 'Lounge') THEN
             INSERT INTO public.channels (community_id, name, type, category, is_readonly)
             VALUES (comm.id, 'Lounge', 'voice', 'VOICE CHANNELS', false);
        END IF;

        -- Check/Create General
        SELECT id INTO existing_gen FROM public.channels WHERE community_id = comm.id AND name = 'general';
        
        IF existing_gen IS NULL THEN
            INSERT INTO public.channels (community_id, name, type, category, is_readonly)
            VALUES (comm.id, 'general', 'text', 'TEXT CHANNELS', false)
            RETURNING id INTO gen_id;
            
            -- Migrate existing messages for this community to the new 'general' channel
            UPDATE public.community_messages 
            SET channel_id = gen_id 
            WHERE community_id = comm.id AND channel_id IS NULL;
        ELSE
            -- Just migrate orphan messages if any
            UPDATE public.community_messages 
            SET channel_id = existing_gen 
            WHERE community_id = comm.id AND channel_id IS NULL;
        END IF;

    END LOOP;
END $$;

-- 5. Add rules_content to communities table if needed (or we just use the channel description/messages)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'rules_content') THEN
        ALTER TABLE public.communities ADD COLUMN rules_content TEXT DEFAULT '1. Be Make It Happen. 2. Be Respectful.';
    END IF;
END $$;
