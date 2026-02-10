
-- Communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🎯',
  habit_category TEXT NOT NULL DEFAULT 'General',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community members table
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Communities: anyone authenticated can view
CREATE POLICY "Authenticated users can view communities"
  ON public.communities FOR SELECT
  TO authenticated
  USING (true);

-- Communities: authenticated users can create
CREATE POLICY "Authenticated users can create communities"
  ON public.communities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Communities: creator can update
CREATE POLICY "Creator can update community"
  ON public.communities FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Communities: creator can delete
CREATE POLICY "Creator can delete community"
  ON public.communities FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Members: anyone authenticated can view members
CREATE POLICY "Authenticated users can view members"
  ON public.community_members FOR SELECT
  TO authenticated
  USING (true);

-- Members: authenticated users can join (insert themselves)
CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Members: users can leave (delete themselves)
CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
