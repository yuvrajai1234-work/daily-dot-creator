-- Create a function to delete a user's own account
-- This must be SECURITY DEFINER to have permission to delete from auth.users
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
  -- Perform the deletion in auth.users
  -- This will trigger the cascade deletions in public tables (profiles, habits, etc.)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure only authenticated users can call this
REVOKE ALL ON FUNCTION public.delete_user() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
