# 📝 Journal Reflection Quest Fix

## Issue
The "Daily Reflection" quest in the Inbox was showing as claimable even when the user hadn't written a journal entry for today (Feb 15). It was checking the total lifetime count of reflections instead of checking for today's reflection.

## Root Cause
The Inbox page checked `stats.totalReflections > 0` which is a cumulative count of ALL reflections ever written, not just today's reflection.

### **The Problem:**
```typescript
// BEFORE: Checked lifetime total
completed: (stats?.totalReflections || 0) > 0,

// If user wrote ANY reflection ever, this was always true!
// User wrote reflection on Feb 14: totalReflections = 1
// On Feb 15 (new day): totalReflections still = 1
// Result: Quest shows as complete even for Feb 15! ❌
```

## Solution
Created a new hook `useTodayReflection()` that checks if a reflection exists for today's date (using IST timezone).

### **New Hook:**
```typescript
export const useTodayReflection = () => {
  const { user } = useAuth();
  const today = getAppDate(); // Current date in IST

  return useQuery({
    queryKey: ["today-reflection", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_reflections")
        .select("*")
        .eq("reflection_date", today)
        .maybeSingle();
      if (error) throw error;
      return data; // Returns reflection or null
    },
    enabled: !!user,
  });
};
```

### **Updated Inbox:**
```typescript
// NOW: Check today's reflection
const { data: todayReflection } = useTodayReflection();
const hasWrittenReflectionToday = !!todayReflection;

// In quest definition:
{
  id: "quest-reflection",
  title: "Daily Reflection",
  description: "Write a journal entry or reflection",
  reward: 5,
  icon: "📝",
  completed: hasWrittenReflectionToday, // ✅ IST-aware!
  claimed: claimedIds.has("quest-reflection"),
}
```

## How It Works Now

### **Scenario: No Reflection Today**
```
Current Date (IST): Feb 15
User's reflections:
  - Feb 14: "Today was great!"
  - (No entry for Feb 15 yet)

Check: reflection_date = "2026-02-15"
Result: null (no reflection found)

hasWrittenReflectionToday: false
Quest Status: ❌ Not Complete
Claim Button: Disabled
```

### **Scenario: Wrote Reflection Today**
```
Current Date (IST): Feb 15
User's reflections:
  - Feb 14: "Today was great!"
  - Feb 15: "New day, new goals!" ✅

Check: reflection_date = "2026-02-15"
Result: { content: "New day...", ... }

hasWrittenReflectionToday: true
Quest Status: ✅ Complete!
Claim Button: Enabled (if not claimed)
```

### **Scenario: Next Day**
```
Current Date (IST): Feb 16
User's reflections:
  - Feb 14: "Today was great!"
  - Feb 15: "New day, new goals!"
  - (No entry for Feb 16 yet)

Check: reflection_date = "2026-02-16"
Result: null (no reflection for today)

hasWrittenReflectionToday: false
Quest Status: ❌ Not Complete
Claim Button: Disabled

→ Resets every day!
```

## Files Changed

### **1. src/hooks/useHabits.ts**
Added `useTodayReflection()` hook:
```typescript
export const useTodayReflection = () => {
  const { user } = useAuth();
  const today = getAppDate(); // IST date
  
  return useQuery({
    queryKey: ["today-reflection", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_reflections")
        .select("*")
        .eq("reflection_date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
```

### **2. src/pages/Inbox.tsx**
```typescript
// Import the hook
import { useTodayCompletions, useTodayReflection } from "@/hooks/useHabits";

// Use it
const { data: todayReflection } = useTodayReflection();
const hasWrittenReflectionToday = !!todayReflection;

// Update quest
completed: hasWrittenReflectionToday, // Instead of stats.totalReflections
```

### **3. src/hooks/useNotifications.ts**
```typescript
// Also updated to use today's reflection
const { data: todayReflection } = useTodayReflection();
const hasWrittenReflectionToday = !!todayReflection;

// In notification logic
if (hasWrittenReflectionToday && !claimedIds.has("quest-reflection")) {
  // Show claimable notification
}
```

## Benefits

### **Accurate Daily Tracking**
✅ Only shows as complete for today's reflection  
✅ Resets every day at midnight IST  
✅ No false positives from old reflections

### **IST Timezone Aware**
✅ Uses `getAppDate()` for date checking  
✅ Consistent with habits and rewards  
✅ Everything resets at midnight IST

### **Better User Experience**
✅ Clear feedback on what's needed  
✅ Encourages daily reflection writing  
✅ No confusion about quest status

## Testing

**Before Fix:**
```
1. Write reflection on Feb 14 ✅
2. Wait until midnight (Feb 15 starts)
3. Check Inbox
4. ❌ Reflection quest shows as complete
5. ❌ Can claim reward without writing today
```

**After Fix:**
```
1. Write reflection on Feb 14 ✅
2. Wait until midnight (Feb 15 starts)
3. Check Inbox
4. ✅ Reflection quest shows as incomplete
5. ✅ Must write Feb 15 reflection to claim
6. Write reflection for Feb 15 ✅
7. ✅ Quest becomes complete
8. ✅ Can now claim reward
```

## Related Systems

This fix works together with:
- **`getAppDate()`** - IST timezone handling
- **Habit completions** - Also use IST dates
- **Inbox rewards** - Also use IST dates
- **Daily reflections** - Storage uses IST dates

---

**Journal quest now properly checks for today's reflection!** 📝✨
