# XP & Leveling System Implementation

## 🎮 Overview

A comprehensive gamification system that rewards users with XP (experience points) for engaging with the app. Users level up through a geometric progression system designed to make Level 100 achievable in approximately 5 years of consistent daily engagement.

## 📊 Level Progression Formula

### Geometric Progression
- **Base XP**: 100 XP for Level 1
- **Growth Rate**: 1.058 multiplier
- **Formula**: `XP_required(n) = 100 × (1.058)^(n-1)`

### Time to Level 100
- **Daily XP**: ~60-80 XP (with consistent engagement)
- **Total XP needed**: ~146,000 XP
- **Time estimate**: ~5 years at 70 XP/day average
- **Level milestones**:
  - Level 10: ~7 days
  - Level 25: ~1 month
  - Level 50: ~1 year
  - Level 75: ~3 years
  - Level 100: ~5 years

## 🏆 XP Rewards Table

| Activity | XP Earned | Description |
|----------|-----------|-------------|
| **Daily Login** | 5 XP | Logging into the app (once per day) |
| **Log Habit** | 10 XP | Completing a habit check-in |
| **Journal Entry** | 15 XP | Writing a daily reflection |
| **Claim Quest Reward** | 10 XP | Claiming B Coin rewards |
| **Claim Achievement** | 20 XP | Claiming achievement A Coins |
| **Streak Milestone** | 30 XP | Reaching streak milestones |
| **Community Post** | 10 XP | Creating a community post (future) |
| **Community Comment** | 5 XP | Commenting on posts (future) |
| **Premium Purchase** | 25 XP | Buying P Coins (future) |
| **E-Book Chapter** | 10 XP | Reading e-book content (future) |

## 🎯 Level Tiers

Users progress through different tiers as they level up:

| Level Range | Tier Name | Color | Description |
|-------------|-----------|-------|-------------|
| 1-14 | **Novice** | Gray | Just starting out |
| 15-29 | **Apprentice** | Silver | Learning the ropes |
| 30-44 | **Intermediate** | Orange | Making progress |
| 45-59 | **Advanced** | Green | Experienced user |
| 60-74 | **Expert** | Cyan | Highly skilled |
| 75-89 | **Master** | Purple | Nearly legendary |
| 90-100 | **Legendary** | Gold | Elite status |

## 🗃️ Database Schema

### XP Transactions Table
```sql
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  xp_amount INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  activity_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Profile Extensions
```sql
ALTER TABLE profiles ADD COLUMN level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN current_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN total_xp INTEGER DEFAULT 0;
```

## 🔧 Database Functions

### `calculate_xp_for_level(target_level)`
Calculates XP required for a specific level using geometric progression.

### `add_xp_to_user(user_id, xp_amount, activity_type, activity_id, description)`
- Awards XP to user
- Automatically handles level ups (can level up multiple times)
- Inserts transaction record
- Returns: `{new_level, level_up, xp_gained}`

## 💻 Frontend Implementation

### Hooks (`src/hooks/useXP.ts`)

#### `useLevelInfo()`
Returns current level information:
```typescript
{
  level: number,
  currentXP: number,
  totalXP: number,
  xpNeeded: number,
  progress: number // 0-100%
}
```

#### `useAddXP()`
Mutation hook to add XP:
```typescript
const addXP = useAddXP();
addXP.mutate({
  amount: 10,
  activityType: "habit_log",
  activityId: habitId,
  description: "Logged a habit"
});
```

#### `useXPTransactions(limit)`
Fetches recent XP transaction history.

#### `useLevelLeaderboard()`
Fetches top 100 users by level and total XP.

### Components

#### `<XPProgressBar />`
Displays user's level progress with:
- Current level and tier badge
- Progress bar to next level
- Total XP earned
- XP needed for next level

**Props:**
- `compact?: boolean` - Minimal display mode
- `showDetails?: boolean` - Show total XP stats

## 🎨 UI/UX Features

### Level Up Animation
When user levels up, they see:
- 🎉 Toast notification: "Level Up! You reached Level X!"
- Duration: 5 seconds
- Celebratory message

### XP Gain Feedback
On XP earn:
- Toast notification: "+X XP earned!"
- Updated progress bar
- Duration: 2 seconds

### Activity Feedback Updates
All reward toasts now show XP:
- "Effort logged! (-10 B Coins, +10 XP)"
- "Reflection saved! (-5 B Coins, +15 XP)"
- "🏆 Claimed 25 A Coins! (+20 XP)"
- "🪙 Claimed 5 B Coins! (+10 XP)"

## 🔄 Integration Points

XP is automatically awarded when users:

1. **Log Habits** (`useLogEffort` in `useHabits.ts`)
2. **Write Journals** (`useSaveReflection` in `useHabits.ts`)
3. **Claim A Coins** (`useClaimACoins` in `useCoins.ts`)
4. **Claim B Coins** (`useClaimBCoins` in `useCoins.ts`)

Future integrations:
- Daily login bonus
- Community engagement
- Premium features
- E-book reading

## 📈 Analytics & Tracking

The `xp_transactions` table allows tracking:
- Most popular activities
- User engagement patterns
- XP earning velocity
- Activity type distribution

## 🚀 Future Enhancements

1. **Level Rewards**
   - Unlock special features at milestone levels
   - Exclusive avatars/themes
   - Increased B Coin caps

2. **Seasonal Events**
   - Double XP weekends
   - Special event challenges
   - Limited-time bonuses

3. **Achievements**
   - "Reach Level 10"
   - "Earn 1000 XP in a day"
   - "Complete 100 activities"

4. **Social Features**
   - Friend level comparison
   - Guild/team leveling
   - Competitive leaderboards

## 📝 Notes

- All TypeScript errors related to database types will resolve after running the migration
- The system uses IST timezone alignment (consistent with the rest of the app)
- XP transactions are permanent and cannot be deleted (audit trail)
- Level progress is never reset (different from B Coins which reset weekly)

## 🧪 Testing

To test the system:
1. Run the migration: `supabase db reset` or apply the migration
2. Complete an activity (log habit, write journal, claim reward)
3. Check the XP progress bar for updates
4. Query `xp_transactions` to see audit trail
5. Manually add XP using `add_xp_to_user()` function

## 🎯 Success Metrics

The system is successful if:
- ✅ Users engage more frequently with the app
- ✅ Completion rates increase
- ✅ Users return daily to earn XP
- ✅ Level progression feels rewarding not grindy
- ✅ 5-year timeline to Level 100 is accurate
