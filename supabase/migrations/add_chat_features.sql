-- Add reply and pin support to messages
ALTER TABLE public.community_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.community_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Create reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.community_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_user_emoji_reaction UNIQUE(message_id, user_id, emoji)
);

-- RLS for reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View reactions" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Add reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Remove reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);
