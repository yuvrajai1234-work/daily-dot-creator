# Popup Toast Notifications for New Rewards

## Feature Added
When a new claimable reward appears in your notifications, a **popup toast notification** will automatically appear in the top-right corner of the screen.

## Behavior

### ✨ What Triggers the Toast
The toast appears when:
- ✅ A new daily quest becomes claimable (login, habit, reflection)
- ✅ A streak milestone is reached (3-day, 7-day, 15-day, 30-day)
- ✅ An achievement is earned
- ✅ Any other claimable notification appears

### ⏱️ Duration
- Appears for **2 seconds** automatically
- Auto-dismisses after 2 seconds
- Can be manually dismissed by clicking the X

### 🖱️ Click to Navigate
- **Clicking the toast** navigates to the `/inbox` page
- Shows "Click to view in Inbox →" text to indicate clickability
- Cursor changes to pointer on hover

### 🎨 Design
The toast shows:
- Notification icon (emoji) on the left
- Title (e.g., "Daily Login Reward")
- Description (e.g., "You logged in today!")
- Call-to-action text: "Click to view in Inbox →"

### 🎯 Smart Behavior
- **Does NOT show on initial page load** - Only shows for truly NEW notifications
- **Tracks previous notifications** - Only shows toasts for notifications that appear after initial load
- **Filters to claimable only** - Only shows toasts for notifications with rewards you can claim
- **No duplicates** - Each notification only triggers a toast once

## Technical Implementation

### File Modified
`src/components/NotificationPopover.tsx`

### Key Features
1. **useRef for tracking**: `previousNotificationIds` tracks which notifications were already shown
2. **useRef for initial load**: `isInitialLoad` prevents toasts on first render
3. **useEffect monitoring**: Watches the `notifications` array for changes
4. **Toast library**: Uses `sonner` toast library with custom JSX content
5. **Navigation**: Uses React Router's `navigate()` to route to `/inbox`

### Code Added
```typescript
const previousNotificationIds = useRef<Set<string>>(new Set());
const isInitialLoad = useRef(true);

useEffect(() => {
  const claimableNotifications = notifications.filter(n => n.claimable);
  const currentIds = new Set(claimableNotifications.map(n => n.id));

  // Skip showing toasts on initial load
  if (isInitialLoad.current) {
    previousNotificationIds.current = currentIds;
    isInitialLoad.current = false;
    return;
  }

  // Find new notifications that weren't in the previous set
  claimableNotifications.forEach(notif => {
    if (!previousNotificationIds.current.has(notif.id)) {
      // Show toast with custom content
      toast(/* ... */, {
        duration: 2000,
        position: "top-right",
      });
    }
  });

  previousNotificationIds.current = currentIds;
}, [notifications, navigate]);
```

## Example Scenarios

### Scenario 1: User Completes a Habit
1. User marks a habit as complete
2. System detects new claimable reward: "Habit Check-in Complete"
3. **Toast appears** in top-right for 2 seconds: "✅ Habit Check-in Complete"
4. User clicks toast → Navigates to Inbox

### Scenario 2: User Reaches 3-Day Streak
1. User logs in on day 3 of streak
2. System detects new milestone: "3-Day Streak Achieved! 🔥"
3. **Toast appears**: "🔥 3-Day Streak Achieved!"
4. User sees toast, knows they have a new reward to claim

### Scenario 3: Page Refresh
1. User refreshes the page
2. Existing claimable notifications load
3. **No toasts appear** (initial load is skipped)
4. Only NEW notifications after this will trigger toasts

## User Experience Flow

```
[Notification Becomes Claimable]
           ↓
[Toast Appears (Top-Right)]
           ↓
    [Auto-dismiss in 2s]
           OR
    [User clicks toast]
           ↓
    [Navigate to /inbox]
           ↓
[User sees full notification list]
```

## Benefits

✅ **Immediate feedback** - Users know right away when they earn a reward  
✅ **Non-intrusive** - Auto-dismisses quickly  
✅ **Actionable** - Click to navigate directly to rewards  
✅ **Smart** - Doesn't spam on page load  
✅ **Visual** - Shows emoji and description for context
