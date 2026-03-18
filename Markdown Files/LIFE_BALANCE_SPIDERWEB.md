# ✨ Life Balance Spider Web Feature

## Overview
Added a **Life Balance Spider Web** visualization to the Profile page that allows users to track and visualize their balance across 6 life categories using an interactive radar chart.

## 🎯 Features Added

### 1. **Interactive Radar Chart**
- Visual spider web chart showing 6 life categories
- Real-time updates as sliders change
- Color-coded for easy reading

### 2. **6 Life Categories**
Each with its own color and slider:
- 🟣 **Career** (Purple) - Professional growth and work satisfaction
- 🔵 **Strength** (Blue) - Physical fitness and health
- 🔴 **Relationships** (Red) - Social connections and love
- 🟢 **Spirituality** (Green) - Inner peace and purpose
- 🟠 **Learning** (Orange) - Knowledge and skill development
- 🟢 **Nutrition** (Light Green) - Diet and eating habits

### 3. **Separate Edit Controls**
- **Personality Spectrum** has its own Edit/Save/Cancel buttons
- **Life Balance Spider Web** has its own Edit/Save/Cancel buttons
- **Profile Info** keeps its own Edit/Save/Cancel buttons
- Each section is independent

### 4. **Data Persistence**
- Scores saved to user metadata in Supabase
- Persists across sessions
- Loads automatically on page load

## 📊 How It Works

### Visual Representation
```
        Career (Purple)
           /\
          /  \
Learning /    \ Strength
  (Orange)    (Blue)
      |        |
      |        |
Nutrition  Relationships
 (Green)    (Red)
      \      /
       \    /
     Spirituality
       (Green)
```

The larger the area covered by the web, the more balanced your life is!

## 🎨 UI Design

```
┌────────────────────────────────────────┐
│ Life Balance Spider Web    [Edit]      │
│ A visual representation of your life   │
├────────────────────────────────────────┤
│                                        │
│    [Radar Chart Visualization]         │
│         Interactive Spider Web         │
│                                        │
├────────────────────────────────────────┤
│ Adjust Your Scores                     │
│                                        │
│ Career            ●─────────── 75      │
│ Strength          ───●───────── 60     │
│ Relationships     ──────●────── 80     │
│ Spirituality      ──●────────── 45     │
│ Learning          ─────────●─── 85     │
│ Nutrition         ─────●──────── 70     │
│                                        │
│ [Save Scores Button] (when editing)    │
└────────────────────────────────────────┘
```

## 💾 Data Structure

### Saved to User Metadata
```typescript
{
  lifeBalanceScores: {
    Career: 75,
    Strength: 60,
    Relationships: 80,
    Spirituality: 45,
    Learning: 85,
    Nutrition: 70
  }
}
```

### Default Values
All categories start at `50` (mid-point) if not set.

## 📋 Page Structure

The Profile page now has **3 independent sections** in the right column:

1. **Your Stats** (Top)
   - Total Habits, Completions, Best Streak, Reflections
   - View only (no edit)

2. **Personality Spectrum** (Middle)
   - 4 sliders for MBTI personality
   - MBTI type calculator
   - Independent Edit/Save/Cancel

3. **Life Balance Spider Web** (Bottom) ← **NEW**
   - 6 sliders for life categories
   - Radar chart visualization
   - Independent Edit/Save/Cancel

## ✨ Example Use Cases

### Example 1: Balanced Life
```
Career: 80
Strength: 75
Relationships: 85
Spirituality: 70
Learning: 80
Nutrition: 75

Result: Large, balanced hexagon shape
```

### Example 2: Workaholic
```
Career: 95
Strength: 40
Relationships: 30
Spirituality: 25
Learning: 85
Nutrition: 35

Result: Lopsided shape pointing toward Career/Learning
```

### Example 3: Well-Rounded Growth
```
Career: 70
Strength: 70
Relationships: 75
Spirituality: 65
Learning: 70
Nutrition: 70

Result: Nearly perfect hexagon
```

## 🎯 Benefits

✅ **Visual Feedback** - See your life balance at a glance  
✅ **Goal Setting** - Identify areas to improve  
✅ **Progress Tracking** - Update as you grow  
✅ **Self-Awareness** - Understand where you're thriving/struggling  
✅ **Motivation** - Strive for a balanced hexagon  
✅ **Independent** - Edit separately from personality

## 🔧 Technical Details

### Files Created/Modified

1. **`src/components/LifeBalanceSpiderWeb.tsx`** (NEW)
   - Standalone component with own state
   - Edit/Save/Cancel logic built-in
   - Uses Recharts for visualization

2. **`src/pages/Profile.tsx`** (MODIFIED)
   - Added `isEditingPersonality` state
   - Separate handlers for personality edit/save/cancel
   - Imported and rendered LifeBalanceSpiderWeb

### Dependencies
- **Recharts** - For radar chart visualization
  - `RadarChart`, `Radar`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`

### Chart Configuration
```typescript
<RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
  <PolarGrid />
  <PolarAngleAxis dataKey="subject" />
  <PolarRadiusAxis domain={[0, 100]} />
  <Radar 
    dataKey="score" 
    stroke="primary" 
    fill="primary" 
    fillOpacity={0.6} 
  />
</RadarChart>
```

## 🎮 User Interaction

### View Mode
1. See current spider web visualization
2. See current scores for each category
3. Sliders are disabled (read-only)

### Edit Mode
1. Click "Edit" button
2. Adjust sliders for each category
3. Spider web updates in real-time
4. Click "Save" to persist changes
5. Click "Cancel" to revert changes

### Independent Editing
- Can edit Personality Spectrum while Life Balance is saved
- Can edit Life Balance while Personality is saved
- Can edit Profile Info while both are saved
- Each section is completely independent

## 📈 Future Enhancements

Potential improvements:
- **Historical tracking** - See how balance changes over time
- **Goal setting** - Set target scores for each category
- **Suggestions** - AI recommends actions to improve low scores
- **Comparisons** - Compare with community averages
- **Custom categories** - Add your own life areas
- **Export** - Download spider web as image

---

**Now you can visualize and track your overall life balance alongside your personality profile!** 🎉🕸️
