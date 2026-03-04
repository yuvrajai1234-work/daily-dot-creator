CREATE TABLE IF NOT EXISTS public.community_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  invited_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inviter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(community_id, invited_user_id)
);

ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invites or invites for their community"
  ON public.community_invites
  FOR SELECT
  USING (
    invited_user_id = auth.uid() OR
    inviter_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = community_invites.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can send invites"
  ON public.community_invites
  FOR INSERT
  WITH CHECK (
    inviter_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = community_invites.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Invited users can update their invite status"
  ON public.community_invites
  FOR UPDATE
  USING (invited_user_id = auth.uid());

CREATE POLICY "Admins and moderators can delete invites"
  ON public.community_invites
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_members.community_id = community_invites.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role IN ('admin', 'moderator')
    )
  );

-- Function to handle accepting an invite automatically
CREATE OR REPLACE FUNCTION public.handle_invite_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Insert into members
    INSERT INTO public.community_members (community_id, user_id, role)
    VALUES (NEW.community_id, NEW.invited_user_id, 'member')
    ON CONFLICT (community_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_invite_accepted
  AFTER UPDATE ON public.community_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invite_accepted();
