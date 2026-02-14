# Fixed: Inbox Page Claiming System

## Issue Fixed
The Inbox page was showing "Claim" buttons for daily quests and streak rewards, but clicking them:
1. Did NOT actually award coins to the user
2. Did NOT track that rewards were claimed
3. Kept showing the "Claim" button even after clicking (could claim infinitely)

## Changes Made to `src/pages/Inbox.tsx`

### 1. Added Real Claiming Hooks
```typescript
import { useClaimedRewards, useClaimBCoins } from "@/hooks/useCoins";

const { data: claimedRewards = [] } = useClaimedRewards();
const claimBCoins = useClaimBCoins();
const claimedIds = new Set(claimedRewards.map((cr) => cr.reward_id));
```

### 2. Updated Quest IDs to Match System
Changed quest IDs to match the notification system:
- `"login"` → `"quest-login"`
- `"habit"` → `"quest-habit"`
- `"reflection"` → `"quest-reflection"`
- `"community"` → `"quest-community"`

### 3. Track Claimed Status
Each quest now checks if it's been claimed:
```typescript
claimed: claimedIds.has("quest-login")
```

### 4. Updated UI Logic
**Before**: Showed "Claim" button for all completed quests
**After**: Shows 3 different states:
- ✅ **Completed & Not Claimed**: Shows "Claim" button (purple gradient)
- ✅ **Claimed**: Shows "Claimed" badge with checkmark (green)
- ⏳ **Incomplete**: Shows "Incomplete" badge (gray)

### 5. Real Claim Function
Updated `handleClaim` to use the actual mutation:
```typescript
const handleClaim = (questId: string, questTitle: string, reward: number) => {
  claimBCoins.mutate({ amount: reward, rewardId: questId });
};
```

### 6. Streak Claims
Streak milestones now also:
- Check if already claimed: `!claimedIds.has(`streak-${milestone.days}`)`
- Show "Claimed" badge if already claimed
- Use correct IDs: `streak-3`, `streak-7`, `streak-15`, `streak-30`

## Result

✅ **Clicking "Claim"**:
1. Awards the correct amount of B coins to the user
2. Records the claim in the database
3. Immediately shows "Claimed" badge (green with checkmark)
4. Prevents claiming the same reward again today
5. Shows success toast notification

✅ **Next Day**:
- Claims reset (new date in database)
- "Claim" buttons appear again for completed quests

✅ **Synchronized with Notifications**:
- Inbox page and Notification popover both use same claiming system
- Claiming in one place reflects in the other
