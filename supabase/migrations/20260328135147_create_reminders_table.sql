CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    time TEXT NOT NULL,
    date DATE NOT NULL,
    is_special BOOLEAN NOT NULL DEFAULT false,
    completed BOOLEAN NOT NULL DEFAULT false,
    notified_day BOOLEAN NOT NULL DEFAULT false,
    notified_time BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Turn on RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reminders"
    ON public.reminders
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
    ON public.reminders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
    ON public.reminders
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
    ON public.reminders
    FOR DELETE
    USING (auth.uid() = user_id);
    
-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON public.reminders(date);
