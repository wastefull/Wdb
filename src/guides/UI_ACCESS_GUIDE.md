# WasteDB Multi-Dimensional Features - UI Access Guide

**Last Updated:** October 22, 2025  
**For:** Phase 5 Multi-Dimensional Scientific Data Layer

---

## Quick Navigation

Here's where you can find all the new multi-dimensional features in the WasteDB UI:

---

## 1. ScientificDataEditor (Individual Material Editing)

### How to Access:

1. **Sign in** to WasteDB (admin required)
2. Toggle **Admin Mode** ON (button in header or accessibility menu)
3. **Click on any material** to view its detail page
4. **Scroll down** to the "Scientific Data" section (green collapsible panel)
5. **Click "Edit Scientific Data"** button

### What You'll See:

- **4 Tabs:** Recyclability / Compostability / Reusability / Sources
- **Shared M slider** at the top
- **Parameter editors** for each dimension:
  - **CR:** Y, D, C, U_clean
  - **CC:** B, N, T, H
  - **RU:** L, R, U, C_RU
- **Source browser** with auto-assignment
- **Calculate buttons** that call backend API

### UI Location:

```
Home → Material Card → Material Detail →
Scientific Data (green collapsible) →
"Edit Scientific Data" button
```

### Visual Cue:

- **Green panel** with flask icon 🧪
- Shows confidence level badge (High/Medium/Low)
- Yellow "Edit Scientific Data" button

---

## 2. DataProcessingView (Batch Calculator)

### How to Access:

1. **Sign in** to WasteDB (admin required)
2. Toggle **Admin Mode** ON
3. Click **"Database Management"** button (yellow button on home page)
4. Click the **"Data Processing"** tab (third tab, between "Batch Operations" and "Source Library")

### What You'll See:

- **Shared M_value slider** at top
- **3 tabbed calculators:**
  - **Recyclability (CR)** - Yellow theme
  - **Compostability (CC)** - Red theme
  - **Reusability (RU)** - Blue theme
- Each tab has:
  - Parameter sliders on left
  - Results preview table on right
  - "Calculate" and "Apply to All" buttons

### UI Location:

```
Home → Database Management →
Data Processing Tab →
[Recyclability | Compostability | Reusability] tabs
```

### Visual Cues:

- **Shared M slider:** Prominent card above tabs
- **Color-coded tabs:**
  - CR: `#e4e3ac` (pale yellow)
  - CC: `#c74444` (brick red)
  - RU: `#5a7a8f` (steel blue)

---

## 3. BatchScientificOperations (Import/Export)

### How to Access:

1. **Sign in** to WasteDB (admin required)
2. Toggle **Admin Mode** ON
3. Click **"Database Management"** button
4. In the tabs, click **"Batch Operations"**

### What You'll See:

- **4 tabs:**
  - **Export** - JSON and CSV download
  - **Import** - JSON upload
  - **Batch Operations** - Recalculate confidence levels
  - **Data Quality** - Audit trail
- **Statistics card** showing:
  - Total materials
  - Materials with scientific data (CR/CC/RU)
  - High/Medium/Low confidence counts

### UI Location:

```
Home → Database Management →
Batch Operations Tab →
[Export | Import | Batch Operations | Data Quality]
```

### Key Features:

- **Export CSV:** Now has **39 columns** (was 19)
- **Export JSON:** Includes all CC and RU fields
- **Recalculate:** Uses source weights for accuracy
- **Statistics:** Counts materials with ANY dimension

---

## 4. ScientificMetadataView (Material Detail Display)

### How to Access:

1. **Click any material** card from home page
2. **Scroll to Scientific Data** section (green collapsible)
3. **Click to expand** the panel

### What You'll See:

- **Raw Parameters** - All dimension-specific parameters
- **Composite Scores** - Practical and theoretical scores
- **Sources** - Citation list with parameter mapping
- **Metadata** - Timestamps, versions, confidence

### UI Location:

```
Home → Material Card → Material Detail →
Scientific Data (click to expand)
```

### Visual Cues:

- **Green collapsible panel** with flask icon
- **Confidence badge** (green/yellow/red)
- **Warning icon** if data quality issues detected
- **"Edit Scientific Data"** button (admin only)

---

## 5. QuantileVisualization (Charts)

### How to Access:

1. Navigate to home page
2. Look for the **quantile chart** visualization
3. In the future (not yet implemented), you'll see a **dropdown selector** to switch dimensions

### Current Status:

⏳ **Not yet updated** - Shows Recyclability only

### Coming Soon (Phase 5 - 20% remaining):

- Dropdown: "Recyclability | Compostability | Reusability"
- Color-coded charts per dimension
- Updated tooltips and labels

---

## 📍 Entry Points Summary

| Feature                       | Entry Point                                                  | Admin Required    |
| ----------------------------- | ------------------------------------------------------------ | ----------------- |
| **ScientificDataEditor**      | Material Detail → "Scientific Data" → "Edit Scientific Data" | ✅ Yes            |
| **DataProcessingView**        | Database Management → Data Processing tab                    | ✅ Yes            |
| **BatchScientificOperations** | Database Management → Batch Operations tab                   | ✅ Yes            |
| **ScientificMetadataView**    | Material Detail → "Scientific Data" (collapsible)            | ❌ No (view only) |
| **QuantileVisualization**     | Home page (chart)                                            | ❌ No             |

---

## 🔑 Admin Access Requirements

### To Enable Admin Mode:

1. **Sign in** with an admin account
2. **Toggle Admin Mode** via:
   - **Method A:** Click the user icon in header → Toggle "Admin Mode" switch
   - **Method B:** Red accessibility button → Admin Mode toggle

### Current Admin Account:

- **Email:** natto@wastefull.org
- **Role:** Admin (configured in backend)

### What Admin Mode Unlocks:

- ✅ "Add Material" button
- ✅ "Database Management" button
- ✅ "User Management" button
- ✅ Edit/Delete buttons on materials
- ✅ "Edit Scientific Data" buttons
- ✅ Access to Data Processing
- ✅ Access to Batch Operations

---

## 🎨 Visual Reference

### ScientificDataEditor Tabs

```
┌─────────────────────────────────────────────────┐
│  Infrastructure Maturity (M): ████████░░ 70%   │ ← Shared slider
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [Recyclability] [Compostability] [Reusability] [Sources] │ ← 4 tabs
└─────────────────────────────────────────────────┘

Parameters Section:
├─ Y (Yield): ████████░░ 80%
├─ D (Degradability): ██████████ 100%
├─ C (Contamination): ████░░░░░░ 40%
└─ [Calculate CR] button (API call)

Composite Scores Section:
├─ CR Practical: 42.3%
├─ CR Theoretical: 58.7%
├─ CI 95%: [38.1%, 46.5%]
└─ Confidence: Medium
```

### DataProcessingView Tabs

```
┌─────────────────────────────────────────────────┐
│  Shared Infrastructure Maturity (M)             │
│  ████████████████░░ 80%                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [Recyclability (CR)] [Compostability (CC)] [Reusability (RU)] │
└─────────────────────────────────────────────────┘

┌──────────────────────┬─────────────────────────┐
│  CR Parameters       │  CR Results             │
│  ├─ Y: 75%           │  ┌─────────────────┐   │
│  ├─ D: 80%           │  │ Material | New  │   │
│  ├─ C: 70%           │  │ Glass    │ 95   │   │
│  ├─ U: 60%           │  │ Plastic  │ 45   │   │
│  │                   │  └─────────────────┘   │
│  [Reset] [Calculate] │  [Apply to All]        │
└──────────────────────┴─────────────────────────┘
```

---

## 🧪 Testing the UI

### Test Scenario 1: Edit Individual Material

1. Sign in as admin (natto@wastefull.org)
2. Enable Admin Mode
3. Click on "Aluminum Can" material
4. Scroll to green "Scientific Data" panel
5. Click "Edit Scientific Data"
6. **Expected:** See 4 tabs with shared M slider
7. Switch to "Compostability" tab
8. Adjust B, N, T, H sliders
9. Click "Calculate CC"
10. **Expected:** Loading state, then results appear
11. Click "Save"
12. **Expected:** Material updated, return to detail view

### Test Scenario 2: Batch Calculate All Materials

1. Sign in as admin
2. Click "Database Management"
3. Click "Data Processing" tab
4. Adjust shared M slider to 70%
5. Go to "Recyclability (CR)" tab
6. Set Y=0.8, D=0.9, C=0.7
7. Click "Calculate"
8. **Expected:** Table shows old vs new scores
9. Click "Apply to All"
10. **Expected:** All materials updated

### Test Scenario 3: Export Multi-Dimensional Data

1. Sign in as admin
2. Click "Database Management"
3. Click "Batch Operations" tab
4. Click "Export" tab
5. Click "Export CSV"
6. **Expected:** File downloads
7. Open in Excel
8. **Expected:** 39 columns (CR + CC + RU parameters)

---

## 🐛 Common Issues

### "Edit Scientific Data" Button Not Showing

**Cause:** Not in Admin Mode  
**Solution:** Toggle Admin Mode ON (red button or user menu)

### "Database Management" Button Not Showing

**Cause:** Not signed in as admin  
**Solution:** Sign in with admin account (natto@wastefull.org)

### Scientific Data Panel Empty

**Cause:** No scientific data added yet  
**Solution:** Click "Edit Scientific Data" to add data

### CC/RU Calculations Slow

**Cause:** API calls for each material  
**Solution:** Normal behavior, wait for loading to complete

### M_value Not Saving

**Cause:** Need to click "Calculate" then "Save"  
**Solution:** M_value is used in calculation, saved when you click Save

---

## Related Documentation

- `/docs/SCIENTIFIC_EDITOR_REFACTOR.md` - ScientificDataEditor details
- `/docs/DATA_PROCESSING_VIEW_UPDATE.md` - DataProcessingView details
- `/docs/BATCH_OPERATIONS_UPDATE.md` - BatchScientificOperations details
- `/docs/BACKEND_MULTI_DIMENSIONAL.md` - API reference
- `/docs/PHASE_5_80_PERCENT_MILESTONE.md` - Overall progress

---

## Next Steps (Not Yet in UI)

### Coming Soon (20% remaining):

1. **QuantileVisualization** - Dimension selector dropdown
2. **Source Library** - CC and RU tags added
3. **Material Cards** - Show CC/RU scores on home page

---

**Last Updated:** October 22, 2025  
**Phase 5 Completion:** 80%  
**Tested:** Basic navigation flows  
**Status:** ✅ Ready for user testing
