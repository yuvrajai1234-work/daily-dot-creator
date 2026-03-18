# 🔧 Inbox Rewards Claim Date Fix

## Issue
When claiming inbox rewards after midnight, users were getting "Already claimed today!" even though it was a new day in IST.

## Root Cause
The `claimed_rewards` table used `CURRENT_DATE` (database server UTC time) as the default for `claim_date`, but our app logic checks claims using IST date from `getAppDate()`.

### **The Problem:**
```
Time: 12:50 AM IST on Feb 15, 2026
UTC Time: ~7:20 PM on Feb 14, 2026

Database CURRENT_DATE: Feb 14 (UTC)
App getAppDate(): Feb 15 (IST)

Result: Mismatch! ❌
```

## Solution
Explicitly set `claim_date` to `getAppDate()` when inserting reward claims.

### **Code Change:**
```typescript
// BEFORE (relied on database default)
.insert({
  user_id: user!.id,
  reward_id: rewardId,
  reward_type: "quest",
  coins_claimed: amount,
});

// AFTER (explicit IST date)
.insert({
  user_id: user!.id,
  reward_id: rewardId,
  reward_type: "quest",
  claim_date: getAppDate(), // ✅ IST date
  coins_claimed: amount,
});
```

## How It Works Now

### **Scenario: Claiming After Midnight**
```
Current Time: 12:50 AM IST on Feb 15

getAppDate() returns: "2026-02-15"

Database Insert:
- user_id: <user_uuid>
- reward_id: "daily-quest-1"
- claim_date: "2026-02-15" ✅ (IST)
- coins_claimed: 10

Query Check:
- Get claims where claim_date = "2026-02-15"
- None found for today
- ✅ Claim allowed!
```

### **Scenario: Already Claimed**
```
Current Time: 1:00 AM IST on Feb 15

User tries to claim same reward again:

Database Check:
- claim_date = "2026-02-15"
- reward_id = "daily-quest-1"
- UNIQUE constraint violation!
- ❌ "Already claimed today!"
```

## File Changed
`src/hooks/useCoins.ts` - Line 135:
```typescript
claim_date: getAppDate(), // Use IST date explicitly
```

## Testing
**Before Fix:**
1. Claim reward at 11 PM on Feb 14 ✅
2. Wait until 12:00 AM (midnight) on Feb 15
3. Try to claim again ❌ "Already claimed today!" 

**After Fix:**
1. Claim reward at 11 PM on Feb 14 ✅
2. Wait until 12:00 AM (midnight) on Feb 15
3. Try to claim again ✅ Works! New day!

## Related Changes
This works together with:
- `getAppDate()` in `src/lib/dateUtils.ts`
- `useClaimedRewards()` query using IST date
- All habit completion logic using IST dates

---

**Inbox rewards now properly reset at midnight IST!** 🎁✨
