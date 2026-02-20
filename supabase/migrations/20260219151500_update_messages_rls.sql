-- Allow users to update their own messages
CREATE POLICY "Users can update own messages" ON public.community_messages
FOR UPDATE USING (
    auth.uid() = user_id
);

-- Allow admins and moderators to update any message in their community
CREATE POLICY "Admins and Moderators can update messages" ON public.community_messages
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.community_members
        WHERE community_id = public.community_messages.community_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages" ON public.community_messages
FOR DELETE USING (
    auth.uid() = user_id
);

-- Allow admins and moderators to delete any message
CREATE POLICY "Admins and Moderators can delete messages" ON public.community_messages
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.community_members
        WHERE community_id = public.community_messages.community_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
);
