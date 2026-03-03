-- ============================================================
-- DailyDots — 5-Year Achievements Upgrade
-- Migration: 20260304000000_achievements_5year.sql
--
-- 1. Add rarity / xp_reward / year_target columns
-- 2. Add UNIQUE constraint on name (safe if already unique)
-- 3. Upsert all 100+ achievements (idempotent)
-- ============================================================

-- Step 1: Add new columns (IF NOT EXISTS = safe to re-run)
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS rarity      TEXT    NOT NULL DEFAULT 'common',
  ADD COLUMN IF NOT EXISTS xp_reward   INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS year_target INTEGER NOT NULL DEFAULT 1;

-- Step 2: Add UNIQUE constraint on name so upserts work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.achievements'::regclass
      AND conname  = 'achievements_name_key'
  ) THEN
    ALTER TABLE public.achievements ADD CONSTRAINT achievements_name_key UNIQUE (name);
  END IF;
END;
$$;

-- Step 3: Upsert all 100+ achievements (ON CONFLICT (name) = idempotent)
INSERT INTO public.achievements
  (name, description, icon, category, requirement_type, requirement_value, coin_reward, rarity, xp_reward, year_target)
VALUES

-- ════════ 🌱 BEGINNER — Year 1 ════════
('First Step',          'Complete your very first habit.',       '👣', 'beginner', 'total_completions', 1,   10,  'common', 20,  1),
('Getting Started',     'Complete 10 habits.',                   '🚀', 'beginner', 'total_completions', 10,  20,  'common', 30,  1),
('Building Blocks',     'Complete 25 habits.',                   '🧱', 'beginner', 'total_completions', 25,  30,  'common', 40,  1),
('Habit Curious',       'Create your first habit.',              '✨', 'beginner', 'total_habits',      1,   15,  'common', 20,  1),
('Habit Collector',     'Create 3 different habits.',            '🗂️', 'beginner', 'total_habits',      3,   25,  'common', 30,  1),
('Dear Diary',          'Write your first reflection.',          '📔', 'beginner', 'total_reflections', 1,   15,  'common', 20,  1),
('Centurion',           'Complete 100 habits total.',            '💯', 'beginner', 'total_completions', 100, 50,  'rare',   60,  1),
('First Week Warrior',  'Keep a streak for 7 days.',             '🗓️', 'beginner', 'streak',            7,   30,  'common', 40,  1),
('Two-Week Champion',   'Keep a streak for 14 days.',            '🏅', 'beginner', 'streak',            14,  50,  'rare',   60,  1),
('Month of Momentum',   'Keep a streak for 30 days.',            '🌙', 'beginner', 'streak',            30,  100, 'rare',   100, 1),
('Daily Dotter',        'Log habits on 30 unique days.',         '🟢', 'beginner', 'days_active',       30,  50,  'common', 50,  1),
('Reflective Mind',     'Write 7 reflections.',                  '🪞', 'beginner', 'total_reflections', 7,   30,  'common', 40,  1),
('Level 5 Achiever',    'Reach Level 5.',                        '⭐', 'beginner', 'level',             5,   40,  'common', 50,  1),
('Level 10 Trailblazer','Reach Level 10.',                       '🔟', 'beginner', 'level',             10,  75,  'rare',   75,  1),

-- ════════ 💪 INTERMEDIATE — Year 1–2 ════════
('Habit Enthusiast',  'Create 5 different habits.',              '🌟', 'intermediate', 'total_habits',      5,    50,  'rare',   60,  1),
('Triple Century',    'Complete 300 habits total.',              '🎯', 'intermediate', 'total_completions', 300,  80,  'rare',   80,  1),
('Half Thousand',     'Complete 500 habits total.',              '🏆', 'intermediate', 'total_completions', 500,  100, 'rare',   100, 2),
('Journaling Habit',  'Write 30 reflections.',                   '📖', 'intermediate', 'total_reflections', 30,   60,  'rare',   70,  1),
('Level 20 Scholar',  'Reach Level 20.',                         '🎓', 'intermediate', 'level',             20,   100, 'rare',   100, 2),
('XP Hundredaire',    'Earn 500 total XP.',                      '⚡', 'intermediate', 'total_xp',          500,  60,  'rare',   80,  1),
('XP Thousandaire',   'Earn 1,000 total XP.',                    '💥', 'intermediate', 'total_xp',          1000, 100, 'rare',   100, 2),
('Active All Season', 'Be active 90 unique days.',               '☀️', 'intermediate', 'days_active',       90,   80,  'rare',   80,  1),
('Six-Week Streak',   'Keep a streak for 42 days.',              '🔥', 'intermediate', 'streak',            42,   120, 'rare',   120, 2),
('Sixty Day Blazer',  'Keep a streak for 60 days.',              '🌋', 'intermediate', 'streak',            60,   150, 'epic',   150, 2),
('Habit Architect',   'Create 8 different habits.',              '🏗️', 'intermediate', 'total_habits',      8,    70,  'rare',   80,  2),
('The Analyst',       'Write 60 reflections.',                   '🔬', 'intermediate', 'total_reflections', 60,   80,  'rare',   80,  2),

-- ════════ ⚡ ADVANCED — Year 2–3 ════════
('One Thousand Done',  'Complete 1,000 habits total.',           '🎖️', 'advanced', 'total_completions', 1000, 150, 'epic',  150, 2),
('Two Thousand Strong','Complete 2,000 habits total.',           '💪', 'advanced', 'total_completions', 2000, 200, 'epic',  200, 3),
('Ninety-Day Warrior', 'Keep a streak for 90 days.',             '⚔️', 'advanced', 'streak',            90,   200, 'epic',  200, 2),
('Half-Year Hero',     'Keep a streak for 180 days.',            '🦁', 'advanced', 'streak',            180,  300, 'epic',  300, 3),
('Level 30 Veteran',   'Reach Level 30.',                        '🏹', 'advanced', 'level',             30,   150, 'epic',  150, 2),
('Level 40 Commander', 'Reach Level 40.',                        '🎖️', 'advanced', 'level',             40,   200, 'epic',  200, 3),
('XP Beast',           'Earn 5,000 total XP.',                   '🌩️', 'advanced', 'total_xp',          5000, 200, 'epic',  200, 3),
('Century Journal',    'Write 100 reflections.',                 '📚', 'advanced', 'total_reflections', 100,  120, 'epic',  120, 2),
('Habit Master',       'Create 10 different habits.',            '🎯', 'advanced', 'total_habits',      10,   100, 'epic',  100, 2),
('Active Half Year',   'Be active 180 unique days.',             '🌿', 'advanced', 'days_active',       180,  150, 'epic',  150, 3),

-- ════════ 🔥 STREAKS — Daily momentum ════════
('Spark',              'Keep a 3-day streak.',                   '✨', 'streak', 'streak', 3,    15,   'common',    15,   1),
('Ignition',           'Keep a 5-day streak.',                   '🔥', 'streak', 'streak', 5,    25,   'common',    25,   1),
('One Week On Fire',   'Keep a 7-day streak.',                   '🎆', 'streak', 'streak', 7,    40,   'common',    40,   1),
('Fortnight Blaze',    'Keep a 14-day streak.',                  '🌠', 'streak', 'streak', 14,   60,   'rare',      60,   1),
('Month of Fire',      'Keep a 30-day streak.',                  '🏔️', 'streak', 'streak', 30,   100,  'rare',      100,  1),
('Sixty Burning Days', 'Keep a 60-day streak.',                  '🌋', 'streak', 'streak', 60,   175,  'epic',      175,  2),
('Triple Month',       'Keep a 90-day streak.',                  '🦅', 'streak', 'streak', 90,   250,  'epic',      250,  2),
('One-Year Flame',     'Keep a streak for 365 days.',            '🌞', 'streak', 'streak', 365,  500,  'legendary', 500,  3),
('Unstoppable Force',  'Keep a streak for 500 days.',            '⚡', 'streak', 'streak', 500,  750,  'legendary', 750,  4),
('The Unbroken',       'Keep a streak for 730 days (2 years).',  '🔱', 'streak', 'streak', 730,  1000, 'legendary', 1000, 5),
('Six Month Surge',    'Keep a 180-day streak.',                 '🌊', 'streak', 'streak', 180,  350,  'epic',      350,  3),
('Nine Month Grind',   'Keep a 270-day streak.',                 '💎', 'streak', 'streak', 270,  450,  'legendary', 450,  3),

-- ════════ 🎯 HABITS — Volume & variety ════════
('Habit Hoarder',     'Create 12 unique habits.',                '🗃️', 'habits', 'total_habits',      12,    100,  'epic',      100,  2),
('Completions: 50',   'Complete 50 habits total.',               '5️⃣0️⃣','habits', 'total_completions', 50,    40,   'common',    40,   1),
('Completions: 250',  'Complete 250 habits total.',              '💫', 'habits', 'total_completions', 250,   70,   'rare',      70,   1),
('Completions: 750',  'Complete 750 habits total.',              '🔮', 'habits', 'total_completions', 750,   120,  'rare',      120,  2),
('Three Thousand Done','Complete 3,000 habits total.',           '🚂', 'habits', 'total_completions', 3000,  250,  'epic',      250,  3),
('Five Thousand Pro', 'Complete 5,000 habits total.',            '🎪', 'habits', 'total_completions', 5000,  350,  'legendary', 350,  4),
('Ten Thousand Club', 'Complete 10,000 habits. A true legend.',  '🌌', 'habits', 'total_completions', 10000, 1000, 'legendary', 1000, 5),

-- ════════ ✍️ REFLECTION — Journaling journey ════════
('First Thoughts',      'Write your first reflection.',                       '💭', 'reflection', 'total_reflections', 1,    10,  'common',    20,  1),
('Reflection Rookie',   'Write 10 reflections.',                              '📝', 'reflection', 'total_reflections', 10,   30,  'common',    30,  1),
('Thoughtful',          'Write 25 reflections.',                              '🤔', 'reflection', 'total_reflections', 25,   50,  'rare',      50,  1),
('Deep Thinker',        'Write 50 reflections.',                              '🧠', 'reflection', 'total_reflections', 50,   75,  'rare',      75,  2),
('Journal Master',      'Write 150 reflections.',                             '📕', 'reflection', 'total_reflections', 150,  150, 'epic',      150, 3),
('Author of Self',      'Write 365 reflections — one for every day.',         '✍️', 'reflection', 'total_reflections', 365,  400, 'legendary', 400, 4),
('Philosopher King',    'Write 730 reflections.',                             '👑', 'reflection', 'total_reflections', 730,  750, 'legendary', 750, 5),
('Half Century Journal','Write 500 reflections.',                             '📜', 'reflection', 'total_reflections', 500,  500, 'legendary', 500, 4),

-- ════════ ⭐ LEVELING — XP and level milestones ════════
('Newbie',         'Reach Level 1 — your journey begins!',             '🐣', 'level', 'level',    1,     10,   'common',    10,   1),
('Apprentice',     'Reach Level 5.',                                   '📘', 'level', 'level',    5,     30,   'common',    30,   1),
('Journeyman',     'Reach Level 15.',                                  '🗺️', 'level', 'level',    15,    60,   'rare',      60,   1),
('Expert',         'Reach Level 25.',                                  '🎯', 'level', 'level',    25,    100,  'rare',      100,  2),
('Master',         'Reach Level 35.',                                  '⚡', 'level', 'level',    35,    150,  'epic',      150,  3),
('Grandmaster',    'Reach Level 50.',                                  '🌟', 'level', 'level',    50,    250,  'epic',      250,  3),
('Legend',         'Reach Level 60.',                                  '🔱', 'level', 'level',    60,    400,  'legendary', 400,  4),
('Mythic',         'Reach Level 75.',                                  '🌌', 'level', 'level',    75,    600,  'legendary', 600,  4),
('Transcendent',   'Reach Level 90 — the peak of dedication.',         '💫', 'level', 'level',    90,    900,  'legendary', 900,  5),
('XP Pioneer',     'Earn 100 total XP.',                               '⚡', 'level', 'total_xp', 100,   20,   'common',    20,   1),
('XP Climber',     'Earn 2,500 total XP.',                             '🧗', 'level', 'total_xp', 2500,  100,  'epic',      100,  2),
('XP Titan',       'Earn 10,000 total XP.',                            '🏛️', 'level', 'total_xp', 10000, 300,  'legendary', 300,  4),
('XP Deity',       'Earn 25,000 total XP.',                            '🌠', 'level', 'total_xp', 25000, 750,  'legendary', 750,  5),

-- ════════ 👥 COMMUNITY — Social engagement ════════
('Say Hello',              'Make your first community post.', '👋', 'community', 'community_posts', 1,   10,  'common',    20,  1),
('Conversationalist',      'Make 10 community posts.',        '💬', 'community', 'community_posts', 10,  30,  'common',    30,  1),
('Community Contributor',  'Make 25 community posts.',        '🤝', 'community', 'community_posts', 25,  50,  'rare',      50,  1),
('Social Butterfly',       'Make 50 community posts.',        '🦋', 'community', 'community_posts', 50,  80,  'rare',      80,  2),
('Forum Legend',           'Make 100 community posts.',       '🌐', 'community', 'community_posts', 100, 150, 'epic',      150, 2),
('Voice of the Community', 'Make 250 community posts.',       '📢', 'community', 'community_posts', 250, 300, 'epic',      300, 3),
('Community Icon',         'Make 500 community posts.',       '🏛️', 'community', 'community_posts', 500, 500, 'legendary', 500, 4),

-- ════════ 📅 CONSISTENCY — Days active over time ════════
('First Active Day',  'Log at least one habit on your very first day.', '🟢', 'consistency', 'days_active', 1,    10,   'common',    10,   1),
('One Week Active',   'Be active on 7 unique days.',                    '📅', 'consistency', 'days_active', 7,    25,   'common',    25,   1),
('Month of Activity', 'Be active on 30 unique days.',                   '🗓️', 'consistency', 'days_active', 30,   50,   'common',    50,   1),
('Quarter Year',      'Be active on 90 unique days.',                   '🌍', 'consistency', 'days_active', 90,   100,  'rare',      100,  1),
('Half Year Active',  'Be active on 180 unique days.',                  '🌀', 'consistency', 'days_active', 180,  175,  'rare',      175,  2),
('Annual Active',     'Be active on 365 unique days.',                  '🏆', 'consistency', 'days_active', 365,  350,  'epic',      350,  3),
('Two Year Active',   'Be active on 730 unique days.',                  '⚡', 'consistency', 'days_active', 730,  600,  'epic',      600,  4),
('Five Year Legend',  'Be active on 1,825 unique days — a full 5 years.','🌟','consistency', 'days_active', 1825, 1500, 'legendary', 1500, 5),
('150 Active Days',   'Be active on 150 unique days.',                  '💡', 'consistency', 'days_active', 150,  130,  'rare',      130,  2),
('300 Active Days',   'Be active on 300 unique days.',                  '🔥', 'consistency', 'days_active', 300,  250,  'epic',      250,  3),
('500 Active Days',   'Be active on 500 unique days.',                  '🏅', 'consistency', 'days_active', 500,  400,  'legendary', 400,  4),
('1000 Active Days',  'Be active on 1,000 unique days — nearly 3 years!','💎','consistency', 'days_active', 1000, 800,  'legendary', 800,  5),

-- ════════ 🏆 MILESTONES — Grand cross-category ════════
('Halfway to Legend',   'Reach Level 50 — halfway to the pinnacle.',              '🌠', 'milestone', 'level',             50,   300,  'epic',      300,  3),
('The Full Year',       'Keep a 365-day streak — one entire year unbroken.',      '🎊', 'milestone', 'streak',            365,  750,  'legendary', 750,  3),
('Two Years Strong',    'Be active for 730 unique days.',                         '🥇', 'milestone', 'days_active',       730,  700,  'legendary', 700,  5),
('Completions: 7500',   'Complete 7,500 habits — a master of consistency.',       '🛡️', 'milestone', 'total_completions', 7500, 700,  'legendary', 700,  5),
('Thousand Reflections','Write 1,000 reflections across your journey.',           '📖', 'milestone', 'total_reflections', 1000, 1000, 'legendary', 1000, 5),

-- ════════ 👑 ELITE — Hardest, rarest, years 4–5 ════════
('Elite Status',        'Complete 5,000 habits — join the elite.',          '💠', 'elite', 'total_completions', 5000,  500,  'legendary', 500,  4),
('Grand Sage',          'Reach Level 80.',                                  '🧙', 'elite', 'level',             80,    750,  'legendary', 750,  5),
('The Immortal Streak', 'Maintain a 1,000 day streak — truly immortal.',    '⚰️', 'elite', 'streak',            1000,  2000, 'legendary', 2000, 5),
('XP Overlord',         'Earn 50,000 total XP.',                            '🌐', 'elite', 'total_xp',          50000, 1500, 'legendary', 1500, 5),
('The Five Year Plan',  'Complete 10,000 habits across 5 years.',           '🏆', 'elite', 'total_completions', 10000, 2000, 'legendary', 2000, 5),
('Master of Reflection','Write 1,000 reflections — the wisdom keeper.',     '🔮', 'elite', 'total_reflections', 1000,  1500, 'legendary', 1500, 5),
('Ultimate Achiever',   'Reach Level 100 — the absolute pinnacle.',         '👑', 'elite', 'level',             100,   5000, 'legendary', 5000, 5),
('Everything Everywhere','Be active on 1,500 unique days.',                 '🌌', 'elite', 'days_active',       1500,  1200, 'legendary', 1200, 5)

ON CONFLICT (name) DO UPDATE SET
  description      = EXCLUDED.description,
  icon             = EXCLUDED.icon,
  category         = EXCLUDED.category,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value= EXCLUDED.requirement_value,
  coin_reward      = EXCLUDED.coin_reward,
  rarity           = EXCLUDED.rarity,
  xp_reward        = EXCLUDED.xp_reward,
  year_target      = EXCLUDED.year_target;
