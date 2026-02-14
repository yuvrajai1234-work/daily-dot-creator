# ⏰ IST Date/Time System

## Overview
All daily activities in the Daily Dot Creator app reset at **midnight (12:00 AM) IST** - the standard calendar day boundary:
- **Habit completions** reset at midnight
- **Inbox rewards** reset at midnight  
- **Daily reflections** reset at midnight
- **Greeting** changes at 4:00 AM IST (more natural)

## 🎯 Rationale

### **Why Midnight for All Resets?**
- Standard calendar day boundary (matches user expectations)
- All features reset at the same time (consistency)
- Aligns with how dates work globally
- Simple and predictable for users

### **Why 4:00 AM for Greetings?**
- Most people are asleep before 4 AM
- Natural time for "morning" to begin
- Avoids awkward "Good Night" at 1 AM
- Follows normal social conventions

## 📅 Date Boundary Logic

### **Standard Midnight Boundary**
```
Scenario 1: 11:59 PM IST on Feb 14

System Date: Feb 14
App Date:    Feb 14
Habits:      Feb 14
Rewards:     Feb 14

Reason: Still the same day
```

```
Scenario 2: 12:00 AM IST on Feb 15

System Date: Feb 15
App Date:    Feb 15
Habits:      Feb 15 (RESET!)
Rewards:     Feb 15 (RESET!)

Reason: New day has started!
```

## ⏰ Time Ranges

### **Greetings (Based on 4 AM Boundary)**
```
IST Time          Greeting
─────────────────────────────
12:00 AM - 3:59 AM  Good Night 🌙
 4:00 AM - 11:59 AM Good Morning ☀️
12:00 PM - 4:59 PM  Good Afternoon 🌤️
 5:00 PM - 8:59 PM  Good Evening 🌆
 9:00 PM - 11:59 PM Good Night 🌙
```

### **Day Boundary (Midnight)**
```
IST Time          App Date
─────────────────────────────────
Feb 14 11:00 PM   Feb 14
Feb 14 11:59 PM   Feb 14
Feb 15 12:00 AM   Feb 15 ← New day!
Feb 15  1:00 AM   Feb 15
Feb 15 11:59 PM   Feb 15
```

## 🔧 Technical Implementation

### **Utility File**
`src/lib/dateUtils.ts` contains helper functions:

#### **getAppDate()**
Returns current date in IST (standard midnight boundary)
```typescript
// At 11:59 PM IST on Feb 14
getAppDate() // Returns "2026-02-14"

// At 12:00 AM IST on Feb 15
getAppDate() // Returns "2026-02-15"
```

#### **getGreeting()**
Returns greeting based on IST time (4 AM boundary)
```typescript
// At 3:00 AM IST
getGreeting() // Returns "Good Night"

// At 5:00 AM IST
getGreeting() // Returns "Good Morning"
```

#### **getCompletionDate()**
Alias for getAppDate() for habit completions
```typescript
getCompletionDate() // Returns current IST date
```

## 📋 Files Modified

### **1. src/lib/dateUtils.ts** ✅
- `getAppDate()` - Returns current IST date
- `getGreeting()` - Returns greeting with 4 AM boundary
- `getISTHour()` - Returns current hour in IST
- `isSameAppDay()` - Compares two IST dates
- `getCompletionDate()` - Returns IST date for completions

### **2. src/pages/Dashboard.tsx** ✅
- Uses `getGreeting()` for IST-based greetings

### **3. src/hooks/useHabits.ts** ✅
- `useTodayCompletions()` - Uses IST date
- `useToggleCompletion()` - Uses IST date
- `useLogEffort()` - Uses IST date
- Daily reflections - Uses IST date

### **4. src/hooks/useCoins.ts** ✅
- `useClaimedRewards()` - Uses IST date

## 🎮 User Experience

### **Scenario 1: Late Night**
```
Time: 11:30 PM IST on Feb 14

Greeting: "Good Night 🌙"
App Date: Feb 14
Habits:   Feb 14

→ Log habits before midnight!
```

### **Scenario 2: After Midnight**
```
Time: 12:01 AM IST on Feb 15

Greeting: "Good Night 🌙"
App Date: Feb 15

→ NEW DAY! Habits reset!
→ Inbox rewards reset!
→ Everything fresh!
```

### **Scenario 3: Early Morning**
```
Time: 6:00 AM IST on Feb 15

Greeting: "Good Morning ☀️"
App Date: Feb 15
Habits:   Feb 15

→ New day to make progress!
```

## 📊 Impact on Features

### **Habit Completions** ✅
- Reset at 12:00 AM IST (midnight)
- Users log today's habits
- New slate every midnight

### **Inbox Rewards** ✅
- Reset at 12:00 AM IST (midnight)
- Fresh rewards every day
- Synced with habits

### **Daily Reflections** ✅
- One reflection per calendar day
- Resets at midnight IST
- Standard day boundary

### **Dashboard Greeting** ✅
- Changes at 4:00 AM IST
- More natural greeting times
- Independent of habit resets

## ✨ Benefits

### **For Users**
✅ **Predictable** - Standard midnight reset  
✅ **Consistent** - Everything resets together  
✅ **Natural** - Matches calendar days  
✅ **Simple** - Easy to understand

### **For the App**
✅ **Standard behavior** - Matches user expectations  
✅ **Aligned resets** - Habits and rewards together  
✅ **Better UX** - Clear day boundaries  
✅ **Timezone-aware** - Works correctly for IST

## 🌍 Timezone Handling

### **IST Calculation**
```typescript
const now = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes
const istTime = new Date(now.getTime() + istOffset);
const dateString = istTime.toISOString().split("T")[0];
```

### **Why This Works**
- Adds 5.5 hours to UTC time
- Gets correct IST time regardless of user's location
- Ensures midnight is IST midnight, not local
- Consistent across all users

## 📈 Examples in Practice

### **Example 1: Before Midnight**
```
User logs in at 11:45 PM on Monday (IST)

Dashboard shows:
"Good Night 🌙"
Habits for: Monday
Can complete: Monday's habits

15 minutes left for Monday!
```

### **Example 2: After Midnight**
```
User logs in at 12:05 AM on Tuesday (IST)

Dashboard shows:
"Good Night 🌙"
Habits for: Tuesday (NEW!)
Inbox rewards: RESET!

Fresh start for Tuesday!
```

### **Example 3: Morning**
```
User logs in at 8:00 AM on Tuesday (IST)

Dashboard shows:
"Good Morning ☀️"
Habits for: Tuesday
Inbox rewards: Tuesday's rewards

Working on today's habits!
```

## 🔮 Future Enhancements

Potential additions:
- **Custom Timezone Support** - Let users choose timezone
- **Reminder Notifications** - Daily reminders
- **Streak Protection** - Grace period for streaks
- **Multi-Timezone** - Support for travelers
- **Custom Reset Time** - Let users pick reset hour

## ⚙️ Configuration

Current configuration:
```typescript
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // Fixed IST offset
const MORNING_START_HOUR = 4; // 4:00 AM for greeting
```

Reset time is hardcoded to midnight (standard behavior).

---

**Everything resets at midnight IST - simple, predictable, and natural!** ⏰📅✨


## Overview
Implemented custom date boundaries for the Daily Dot Creator app:
- **New Day (Habits/Rewards)**: Starts at 12:00 PM IST (noon)
- **Morning Greeting**: Starts at 4:00 AM IST

## 🎯 Rationale

### **Why 12:00 PM for New Day?**
- Inbox rewards reset at 12:00 PM IST
- Gives users entire morning to complete habits
- Aligns with lunch/mid-day as natural transition point
- Users who stay up late can still log habits before noon

### **Why 4:00 AM for Greetings?**
- Most people are asleep before 4 AM
- Natural time for "morning" to begin
- Avoids awkward "Good Night" at 1 AM for night owls
- Follows normal social conventions

## 📅 Date Boundary Logic

### **Current System Time vs App Time**
```
Scenario: Current time is 10:00 AM IST on Feb 15

System Date: 2026-02-15
App Date:    2026-02-14  ← Previous day (before noon)

Reason: New day hasn't started yet (< 12:00 PM)
```

```
Scenario: Current time is 1:00 PM IST on Feb 15

System Date: 2026-02-15
App Date:    2026-02-15  ← Same day (after noon)

Reason: New day has started (≥ 12:00 PM)
```

## ⏰ Time Ranges

### **Greetings (Based on 4 AM Boundary)**
```
IST Time          Greeting
─────────────────────────────
12:00 AM - 3:59 AM  Good Night 🌙
 4:00 AM - 11:59 AM Good Morning ☀️
12:00 PM - 4:59 PM  Good Afternoon 🌤️
 5:00 PM - 8:59 PM  Good Evening 🌆
 9:00 PM - 11:59 PM Good Night 🌙
```

### **Day Boundary (Based on 12 PM Boundary)**
```
IST Time          App Date
─────────────────────────────────
Feb 14 12:00 PM   Feb 14
Feb 14  6:00 PM   Feb 14
Feb 14 11:59 PM   Feb 14
Feb 15  6:00 AM   Feb 14 ← Still yesterday!
Feb 15 11:59 AM   Feb 14 ← Still yesterday!
Feb 15 12:00 PM   Feb 15 ← New day starts!
Feb 15  6:00 PM   Feb 15
```

## 🔧 Technical Implementation

### **New Utility File**
Created `src/lib/dateUtils.ts` with helper functions:

#### **getAppDate()**
Returns current "app date" with 12 PM boundary
```typescript
// Example at 10:00 AM IST on Feb 15
getAppDate() // Returns "2026-02-14"

// Example at 1:00 PM IST on Feb 15
getAppDate() // Returns "2026-02-15"
```

#### **getGreeting()**
Returns greeting based on IST time (4 AM boundary)
```typescript
// At 3:00 AM IST
getGreeting() // Returns "Good Night"

// At 5:00 AM IST
getGreeting() // Returns "Good Morning"
```

#### **getCompletionDate()**
Alias for getAppDate() for habit completions
```typescript
getCompletionDate() // Same as getAppDate()
```

## 📋 Files Modified

### **1. src/lib/dateUtils.ts** (NEW)
Created utility functions for custom date/time logic

### **2. src/pages/Dashboard.tsx**
- **Before**: Used `new Date().getHours()` (local time)
- **After**: Uses `getGreeting()` (IST time with 4 AM boundary)

### **3. src/hooks/useHabits.ts**
Updated all date calculations:
- `useTodayCompletions()` - Uses `getAppDate()`
- `useToggleCompletion()` - Uses `getAppDate()`
- `useLogEffort()` - Uses `getAppDate()`
- Daily reflections - Uses `getAppDate()`

### **4. src/hooks/useCoins.ts**
- `useClaimedRewards()` - Uses `getAppDate()`
- Now checks rewards based on 12 PM boundary

## 🎮 User Experience

### **Scenario 1: Late Night User**
```
Time: 11:00 PM IST on Feb 14

Greeting: "Good Night 🌙"
App Date: Feb 14
Can log habits for: Feb 14

→ Still same day, can complete today's habits
```

### **Scenario 2: Early Morning User**
```
Time: 6:00 AM IST on Feb 15

Greeting: "Good Morning ☀️"
App Date: Feb 14

→ Greeting shows morning, but rewards/habits still for yesterday!
→ This gives morning people time to complete "yesterday's" habits
```

### **Scenario 3: After Noon**
```
Time: 12:30 PM IST on Feb 15

Greeting: "Good Afternoon 🌤️"
App Date: Feb 15

→ New day has started
→ Inbox rewards have reset
→ New set of habits to complete
```

## 📊 Impact on Features

### **Habit Completions** ✅
- Logged using `getAppDate()`
- Available until 11:59 AM next day
- Resets at 12:00 PM IST

### **Inbox Rewards** ✅
- Reset at 12:00 PM IST
- Checked using `getAppDate()`
- Users can claim rewards after noon

### **Daily Reflections** ✅
- One reflection per "app day"
- Uses `getAppDate()`
- Resets at 12:00 PM IST

### **Dashboard Greeting** ✅
- Changes at 4:00 AM IST
- Independent of reward resets
- More natural for users

### **Calendar View** ⚠️
- Shows actual calendar dates (unchanged)
- Historical data uses real dates
- Charts display standard dates

## ✨ Benefits

### **For Late Night Users**
✅ Can log habits until noon next day  
✅ Don't lose progress if they forget  
✅ Flexible completion window

### **For Early Morning Users**
✅ "Good Morning" at 4 AM (not midnight)  
✅ Can complete previous day's habits  
✅ Natural greeting times

### **For the App**
✅ Aligned reward reset times  
✅ Consistent date logic  
✅ Better user engagement  
✅ Fewer "missed days"

## 🌍 Timezone Handling

### **IST Calculation**
```typescript
const now = new Date();
const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes
const istTime = new Date(now.getTime() + istOffset);
const istHours = istTime.getUTCHours(); // 0-23
```

### **Why UTC Math?**
- Consistent across all timezones
- Server time doesn't matter
- Always accurate for Indian users
- Works even if user travels

## 📈 Examples in Practice

### **Example 1: Night Owl**
```
User logs in at 11:30 PM on Monday

Dashboard shows:
"Good Night 🌙"
Habits for: Monday
Inbox rewards: Monday's rewards

User completes habits → Logged for Monday
```

### **Example 2: Early Bird**
```
User logs in at 6:00 AM on Tuesday

Dashboard shows:
"Good Morning ☀️"
Habits for: Monday (still!)
Inbox rewards: Monday's rewards (not reset yet)

User completes habits → Logged for Monday
```

### **Example 3: Afternoon**
```
User logs in at 2:00 PM on Tuesday

Dashboard shows:
"Good Afternoon 🌤️"
Habits for: Tuesday
Inbox rewards: Tuesday's rewards (RESET!)

User completes habits → Logged for Tuesday
```

## 🔮 Future Enhancements

Potential additions:
- **Custom Timezone Support** - Let users choose their timezone
- **Custom Day Boundary** - Let users set their own reset time
- **Reminder Scheduling** - Reminders at custom times
- **Multi-Timezone** - Support for travelers
- **Weekend Mode** - Different boundaries for weekends

## ⚙️ Configuration

Current configuration is hardcoded:
```typescript
const DAY_BOUNDARY_HOUR = 12; // 12:00 PM IST
const MORNING_START_HOUR = 4; // 4:00 AM IST
```

To change, update `src/lib/dateUtils.ts`

---

**Your day now starts at noon, giving you maximum flexibility!** ⏰📅✨
