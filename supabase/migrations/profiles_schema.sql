DO $$
BEGIN
    -- Check if the policy exists before creating it to avoid errors
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Public profiles are viewable by everyone'
    ) THEN
        -- Create a policy that allows anyone (authenticated or anon) to view profiles
        -- We typically want at least authenticated users to see them
        CREATE POLICY "Public profiles are viewable by everyone" 
        ON public.profiles 
        FOR SELECT 
        USING (true);
    END IF;
END $$;
