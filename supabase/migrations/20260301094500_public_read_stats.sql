-- ============================================================
-- Allow authenticated users to VIEW (SELECT only) habit stats
-- for other users — needed for the community profile dialog.
--
-- Write operations (INSERT/UPDATE/DELETE) remain restricted
-- to the row owner only.
-- ============================================================

-- habits: any logged-in user can read any habit row
DROP POLICY IF EXISTS "Authenticated users can view all habits" ON public.habits;
CREATE POLICY "Authenticated users can view all habits"
  ON public.habits
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- habit_completions: any logged-in user can read any completion row
DROP POLICY IF EXISTS "Authenticated users can view all completions" ON public.habit_completions;
CREATE POLICY "Authenticated users can view all completions"
  ON public.habit_completions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- daily_reflections: any logged-in user can read any reflection row
DROP POLICY IF EXISTS "Authenticated users can view all reflections" ON public.daily_reflections;
CREATE POLICY "Authenticated users can view all reflections"
  ON public.daily_reflections
  FOR SELECT
  USING (auth.role() = 'authenticated');
