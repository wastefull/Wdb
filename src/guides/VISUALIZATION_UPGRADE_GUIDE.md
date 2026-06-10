# Quantile Visualization Upgrade - Visual Guide 🎨

**Last Updated:** October 22, 2025  
**For:** End Users and Admins

---

## What Changed?

All sustainability score displays in WasteDB now use an **intelligent visualization system** that automatically upgrades from simple bars to sophisticated scientific visualizations when scientific data is available.

---

## Visual Comparison

### Before (Phase 1-4):

```
Material Card:
┌─────────────────────────────────────────┐
│ Aluminum Can                      [Edit]│
│ Metals                                  │
│                                         │
│ Compostability (2)              5       │
│ ████░░░░░░░░░░░░░░░░░░░░ (simple bar)   │
│                                         │
│ Recyclability (3)               95      │
│ ████████████████████████░ (simple bar)  │
│                                         │
│ Reusability (1)                 80      │
│ ████████████████░░░░░░░░ (simple bar)   │
└─────────────────────────────────────────┘
```

**Characteristics:**

- Simple horizontal bars
- Static colors
- Single score shown
- No confidence information
- No scientific transparency

---

### After (Phase 5):

#### Option A: Material WITHOUT Scientific Data

**(Looks identical to old version)**

```
Material Card:
┌─────────────────────────────────────────┐
│ Plastic Bottle                    [Edit]│
│ Plastics                                │
│                                         │
│ Compostability (0)              5       │
│ ████░░░░░░░░░░░░░░░░░░░░ (simple bar)   │
│                                         │
│ Recyclability (2)               65      │
│ █████████████░░░░░░░░░░░ (simple bar)   │
│                                         │
│ Reusability (1)                 40      │
│ ████████░░░░░░░░░░░░░░░░ (simple bar)   │
└─────────────────────────────────────────┘
```

**Same as before!** No disruption for existing materials.

---

#### Option B: Material WITH Scientific Data

**(New quantile visualization)**

```
Material Card:
┌─────────────────────────────────────────┐
│ Aluminum Can                      [Edit]│
│ Metals                                  │
│                                         │
│ Compostability (2)              12      │
│ [        ●●●●●●●●●●         ]           │
│ ├──────────────────────────────┤        │
│ 0    today    25    50    future  100   │
│ ↑ Confidence intervals shown ↑          │
│                                         │
│ Recyclability (3)               89      │
│ [████████         ●●●●●●●●●●●●●●]        │
│ ├──────────────────────────────┤        │
│ 0      today           future     100   │
│ ↑ Gap: 15% between practical/theoretical│
│                                         │
│ Reusability (1)                 75      │
│ [          ●●●●●●●●●●●●●●●      ]        │
│ ├──────────────────────────────┤        │
│ 0    today    50        future    100   │
│ ↑ Overlapping practical/theoretical ↑   │
└─────────────────────────────────────────┘
```

**Enhanced features:**

- ✅ Quantile dot distributions
- ✅ Confidence intervals (halos)
- ✅ Practical (today) vs Theoretical (future) comparison
- ✅ Gap zones visualized
- ✅ Interactive hover tooltips
- ✅ Scientific transparency

---

## 🔄 How the Upgrade Works

### Automatic Transition:

```
Material without scientific data
         ↓
    [Simple Bar]
         ↓
Admin adds scientific data via ScientificDataEditor
         ↓
Backend calculates CC/CR/RU scores
         ↓
    [Quantile Visualization] ← Automatic upgrade!
         ↓
No code changes or manual configuration needed
```

---

## 🎨 Visualization Modes

The system automatically chooses one of three modes based on the data:

### Mode 1: **Overlap** (Close Agreement)

**When:** Practical and theoretical scores are very similar

```
Recyclability               89
[████████       ●●●●●●●●●●●●●●●●●]
├─────────────────────────────┤
0    today      future        100
     ↑______↑  (minimal gap)
```

**Meaning:** Infrastructure is mature, reality matches science  
**Visual:** Dense dot cluster, overlapping halos  
**Example:** Glass recycling, Aluminum recycling

---

### Mode 2: **Near-Overlap** (Small Gap)

**When:** Practical and theoretical are close but distinguishable

```
Reusability                 65
[         ●●●●●●●●●●●●●       ]
├─────────────────────────────┤
0   today    50   future      100
    ↑_______↑ (small gap)
```

**Meaning:** Technology exists but not fully adopted  
**Visual:** Dots bridging the gap, soft merged halos  
**Example:** E-waste reuse, Textile recycling

---

### Mode 3: **Gap** (Large Gap)

**When:** Practical and theoretical scores differ significantly

```
Compostability              15
[    ●●●●●●   Gap: 45%   ●●●●●●●●●]
├──────────────────────────────────┤
0  today  25  [gap]  70  future  100
   ↑___________↑ (large gap)
```

**Meaning:** Science outpaces infrastructure  
**Visual:** Two separate halos, visible gap zone, connecting line  
**Example:** Bioplastic composting, Advanced recycling

---

## What Each Element Means

### 1. **Colored Bar (left side)**

- Shows the guaranteed minimum score
- From 0 to the practical lower confidence bound
- This score is "locked in" with current infrastructure

### 2. **Gray Halo (left)**

- Practical (today) score distribution
- Reflects real-world performance
- Includes uncertainty from measurement

### 3. **Blue Halo (right)**

- Theoretical (future) score distribution
- Represents ideal conditions
- Based on scientific potential

### 4. **Dots (●●●)**

- Quantile distribution
- More dots = more certainty
- Position = most likely score range

### 5. **Time Labels**

- **"today"** = Practical mean (realistic now)
- **"future"** = Theoretical mean (possible with better infrastructure)

---

## 💡 How to Read the Visualizations

### Example 1: Aluminum Can Recyclability

```
Recyclability               95
[██████████████    ●●●●●●●●●●●●●]
├──────────────────────────────┤
0              today future   100
```

**Reading:**

- **Practical Score:** 85% (today's reality)
- **Theoretical Score:** 95% (science potential)
- **Gap:** 10 points - room for improvement
- **Confidence:** High (narrow halos)
- **Interpretation:** Aluminum is highly recyclable today, and with better infrastructure could reach near-perfect recyclability.

---

### Example 2: Plastic Film Compostability

```
Compostability              8
[  ●●●     Gap: 52%      ●●●●●●●]
├──────────────────────────────┤
0  today  20     60  future   100
```

**Reading:**

- **Practical Score:** 8% (today's reality)
- **Theoretical Score:** 60% (science potential)
- **Gap:** 52 points - huge gap!
- **Confidence:** Medium (wider halos)
- **Interpretation:** While compostable plastics exist scientifically, composting infrastructure barely handles them. Major infrastructure investment needed.

---

### Example 3: Glass Bottle Reusability

```
Reusability                 82
[           ●●●●●●●●●●●●●●●●   ]
├──────────────────────────────┤
0        today   future        100
         ↑________↑ (overlap)
```

**Reading:**

- **Practical Score:** 82%
- **Theoretical Score:** 85%
- **Gap:** 3 points - minimal!
- **Confidence:** High (very narrow halos)
- **Interpretation:** Glass bottle reuse works great in practice, nearly matching the theoretical potential. Infrastructure is mature.

---

## 🖱️ Interactive Features

### Hover Tooltip:

When you hover over any visualization, you'll see:

```
┌──────────────────────┐
│ Practical: 85 ± 8%   │
│ Theoretical: 95 ± 3% │
│ Gap: 10 pts          │
│ Confidence: High     │
└──────────────────────┘
```

### Click Action:

Click on any visualization to view related articles for that sustainability category.

---

## 🎨 Color Guide

### Compostability (Coral/Red):

- **Normal Mode:** Soft coral `#e6beb5`
- **High Contrast:** Brick red `#c74444`
- **Dark Mode:** Bright red `#ff6b6b`

### Recyclability (Yellow):

- **Normal Mode:** Pale yellow `#e4e3ac`
- **High Contrast:** Gold `#d4b400`
- **Dark Mode:** Bright yellow `#ffd700`

### Reusability (Blue):

- **Normal Mode:** Pale blue `#b8c8cb`
- **High Contrast:** Steel blue `#4a90a4`
- **Dark Mode:** Bright blue `#6bb6d0`

---

## ♿ Accessibility Features

### High Contrast Mode:

```
Before:                      After:
[Pastel coral bar]    →     [Bright red bar]
[Pastel yellow bar]   →     [Gold bar]
[Pastel blue bar]     →     [Steel blue bar]
```

### Reduced Motion Mode:

- Dot animations disabled
- Instant rendering
- Static display

### Screen Readers:

Full ARIA labels describe:

- Score values
- Confidence levels
- Gap information
- Click actions

---

## 📱 Responsive Design

### Desktop (>768px):

- 150 dots per visualization
- Full hover tooltips
- Larger touch targets

### Mobile (<768px):

- 50 dots (faster rendering)
- Touch-optimized
- Compact labels

---

## 🧪 Testing Your View

### Test 1: Find a Material with Scientific Data

1. Open WasteDB
2. Look for materials with "Scientific Data" panel
3. These will show quantile visualizations

### Test 2: Find a Material without Scientific Data

1. Open WasteDB
2. Look for newly created materials
3. These will show simple bars

### Test 3: Toggle High Contrast

1. Click red accessibility button
2. Toggle "High Contrast" ON
3. Watch colors change to bold versions

### Test 4: Test Dark Mode

1. Click blue accessibility button
2. Toggle "Dark Mode" ON
3. All visualizations adapt

---

## What This Means for You

### As a User:

- **Better understanding** of material sustainability
- **See the science** behind the scores
- **Trust the data** with confidence intervals
- **No learning curve** - simple bars still work the same

### As an Admin:

- **Add scientific data** via ScientificDataEditor
- **Watch visualizations upgrade** automatically
- **No manual configuration** needed
- **Backwards compatible** with existing data

---

## Further Reading

- `/docs/visualization/VISUALIZATION.md` - Current visualization details
- `/guides/UI_ACCESS_GUIDE.md` - Where to find features
- `/whitepapers/VIZ-v1.md` - Visualization methodology
- `/whitepapers/Calculation_Methodology.md` - Score calculation

---

**Questions?** Check the methodology whitepapers or contact the WasteDB team.

---

🎉 **Enjoy the new scientific visualizations!** 🎉

Now you can see the full story behind each sustainability score - from today's reality to tomorrow's potential.
