-- Allow all authenticated users to view all profiles
-- This is necessary for community member lists to work

-- 1. Drop the restrictive policy if it exists (it was named "Users can view own profile")
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 2. Create a new permissive policy for viewing
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Note: Insert/Update/Delete should still remain restricted to the user themselves
-- "Users can update own profile" etc. from the original migration are fine.
