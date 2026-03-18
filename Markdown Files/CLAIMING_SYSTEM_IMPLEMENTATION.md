# Daily Reward Claiming System - Implementation Summary

## Problem
The notification system was showing daily rewards (login, habits, reflections, streaks) as claimable multiple times even after they were claimed. Users could claim the same reward repeatedly on the same day.

## Solution
I've implemented a database-backed tracking system to prevent duplicate claims:

### 1. Database Migration
**File**: `supabase/migrations/20260214153917_claimed_rewards.sql`

Created a new `claimed_rewards` table to track all claimed rewards:
- Tracks `user_id`, `reward_id`, `claim_date`, `coins_claimed`
- Unique constraint on (`user_id`, `reward_id`, `claim_date`) prevents duplicate claims
- Includes RLS policies for secure access
- Indexed for fast lookups

### 2. Backend Changes
**File**: `src/hooks/useCoins.ts`

- Added `ClaimedReward` interface for type safety
- Created `useClaimedRewards()` hook to fetch today's claimed rewards
- Updated `useClaimBCoins()` to accept `rewardId` parameter and record claims in the database
- Added error handling for duplicate claim attempts (shows "Already claimed today!" toast)

### 3. Notification Filtering
**File**: `src/hooks/useNotifications.ts`

- Integrated `useClaimedRewards()` hook
- Created `claimedIds` Set from today's claimed rewards
- Updated notification generation to check `claimedIds` before adding claimable notifications:
  - Daily login: only shown if not claimed today
  - Habit check-in: only shown if not claimed today
  - Reflection: only shown if not claimed today
  - Streak milestones: only shown if not claimed today

### 4. UI Integration
**File**: `src/components/NotificationPopover.tsx`

- Updated `handleClaim()` to pass `rewardId` when claiming B coins
- The notification will disappear after claiming since it won't be returned from `useNotifications()` anymore

## How It Works

1. **User completes a task** (e.g., logs in, completes a habit)
2. **Notification appears** in the notification popover if not already claimed today
3. **User clicks "Claim"** button
4. **System records the claim** in `claimed_rewards` table with today's date
5. **Notification disappears** since `useNotifications()` filters it out (already claimed)
6. **Next day** the claim resets (new date) and the notification appears again
7. **Duplicate attempts** show a friendly "Already claimed today!" message

## Migration Required

⚠️ **Important**: The database migration file has been created but needs to be applied to your Supabase instance:

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20260214153917_claimed_rewards.sql`
4. Paste and run the SQL

### Option 2: Supabase CLI (if configured)
```bash
supabase db push
```

## Testing Steps

After applying the migration:

1. **First Claim**: Click any claimable reward → Should succeed and show success toast
2. **Duplicate Claim**: Try to claim the same reward → Should show "Already claimed today!"
3. **Notification Removal**: After claiming, the notification should disappear from the list
4. **Navigate Away and Back**: The claimed notification should not reappear
5. **Next Day**: Wait until the next day (or manually change system date) → Rewards should be claimable again

## Files Modified

1. ✅ `supabase/migrations/20260214153917_claimed_rewards.sql` - Database schema
2. ✅ `src/hooks/useCoins.ts` - Claim tracking logic
3. ✅ `src/hooks/useNotifications.ts` - Notification filtering
4. ✅ `src/components/NotificationPopover.tsx` - UI integration

## Next Steps

1. Apply the database migration via Supabase dashboard
2. Test the claiming functionality
3. Consider updating `src/pages/Inbox.tsx` to use the same system (currently has separate implementation)
4. Optionally regenerate Supabase types to include `claimed_rewards` table
