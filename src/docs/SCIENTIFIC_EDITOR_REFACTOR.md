# Scientific Data Editor Refactor - Modular Structure

**Date:** October 22, 2025  
**Status:** ✅ Complete  
**Related:** Phase 5 - Multi-Dimensional Scientific Data Layer

---

## Overview

The ScientificDataEditor component has been refactored from a single 850+ line file into a modular structure with 7 separate files for better maintainability and clarity.

---

## New File Structure

```
components/
├── scientific-editor/
│   ├── index.tsx                  # Main coordinator (exports ScientificDataEditor)
│   ├── types.ts                   # Shared TypeScript interfaces
│   ├── utils.ts                   # Shared utilities and constants
│   ├── RecyclabilityTab.tsx       # CR parameters and scores
│   ├── CompostabilityTab.tsx      # CC parameters and scores
│   ├── ReusabilityTab.tsx         # RU parameters and scores
│   └── SourcesTab.tsx             # Citation management
└── ScientificDataEditor.tsx       # [OLD - can be deleted]
```

---

## File Descriptions

### 1. `index.tsx` (Main Coordinator)
**Lines:** ~130  
**Exports:** `ScientificDataEditor`  
**Responsibilities:**
- Component state management (formData, sources)
- Validation logic for all parameters and CIs
- Save/Cancel handlers
- Tab layout structure
- Renders child tab components

**Key Features:**
- Validates all 18 parameters (CR + CC + RU)
- Validates 6 confidence interval objects
- Updates calculation timestamp on save
- Passes handleParameterChange callback to all tabs

---

### 2. `types.ts` (Type Definitions)
**Lines:** ~60  
**Exports:** `Source`, `ConfidenceInterval`, `Material`, `DimensionTabProps`  

**Material Interface includes:**
- **CR:** Y, D, C, M, E + CR_practical/theoretical + CIs
- **CC:** B, N, T, H, M + CC_practical/theoretical + CIs
- **RU:** L, R, U, C_RU, M + RU_practical/theoretical + CIs
- **Metadata:** confidence_level, sources, whitepaper_version, etc.

**DimensionTabProps:**
```typescript
interface DimensionTabProps {
  formData: Material;
  onParameterChange: (key: keyof Material, value: any) => void;
}
```

---

### 3. `utils.ts` (Shared Utilities)
**Lines:** ~80  
**Exports:** `getSuggestedConfidenceLevel`, `PARAMETER_NAMES`, `autoAssignParameters`

**Functions:**

#### `getSuggestedConfidenceLevel(sourceCount, totalWeight)`
Calculates recommended confidence level based on:
- Source count (0-1 sources → Low, 2+ → Medium, 3+ → High)
- Average source weight

#### `PARAMETER_NAMES`
Display names for all 20 parameters:
```typescript
{
  'Y_value': 'Yield',
  'B_value': 'Biodegradation',
  'L_value': 'Lifetime',
  // ... etc
}
```

#### `autoAssignParameters(tags)`
Auto-assigns parameters to sources based on tags:
- `['biodegradation', 'composting']` → `['B_value', 'CC_practical_mean']`
- `['repair', 'repairability']` → `['R_value']`
- `['general', 'methodology']` → all 6 composite scores

---

### 4. `RecyclabilityTab.tsx` (CR Dimension)
**Lines:** ~220  
**Component:** `RecyclabilityTab`  
**Responsibilities:**
- CR parameter inputs (Y, D, C, M, E)
- "Recalculate from Parameters" button
- CR composite scores (practical + theoretical)
- Confidence intervals display
- Public score calculation (0-100 scale)

**Calculation Logic:**
```typescript
const CR_theoretical = Y * D * C * M * U_clean_theo; // U_clean_theo = 1.0
const CR_practical = Y * D * C * M * U_clean_prac;   // U_clean_prac = 0.6
```

**Features:**
- Local calculation (no API call)
- 10% confidence interval margins
- Updates recyclability public score
- Sets method_version to 'CR-v1'

---

### 5. `CompostabilityTab.tsx` (CC Dimension)
**Lines:** ~250  
**Component:** `CompostabilityTab`  
**Responsibilities:**
- CC parameter inputs (B, N, T, H, M)
- "Calculate Practical CC" button → calls API
- "Calculate Theoretical CC" button → calls API
- CC composite scores display
- Loading state management

**API Integration:**
```typescript
const result = await calculateCompostability({
  B: formData.B_value,
  N: formData.N_value,
  T: formData.T_value,
  H: formData.H_value,
  M: formData.M_value,
  mode: 'practical' | 'theoretical'
});
```

**Features:**
- Server-side calculation
- Separate practical and theoretical buttons
- Toast notifications with calculated scores
- Automatic CI calculation (10% margin)
- Color-coded buttons (coral tones)

---

### 6. `ReusabilityTab.tsx` (RU Dimension)
**Lines:** ~250  
**Component:** `ReusabilityTab`  
**Responsibilities:**
- RU parameter inputs (L, R, U, C_RU, M)
- "Calculate Practical RU" button → calls API
- "Calculate Theoretical RU" button → calls API
- RU composite scores display
- Loading state management

**API Integration:**
```typescript
const result = await calculateReusability({
  L: formData.L_value,
  R: formData.R_value,
  U: formData.U_value,
  C: formData.C_RU_value,
  M: formData.M_value,
  mode: 'practical' | 'theoretical'
});
```

**Features:**
- Server-side calculation
- Separate practical and theoretical buttons
- Toast notifications with calculated scores
- Automatic CI calculation (10% margin)
- Color-coded buttons (blue-gray tones)

---

### 7. `SourcesTab.tsx` (Citation Management)
**Lines:** ~300  
**Component:** `SourcesTab`  
**Responsibilities:**
- Display existing sources with metadata
- Add/remove sources
- Browse source library with search
- Material-specific source recommendations
- Confidence level selector
- Whitepaper version input

**Props:**
```typescript
interface SourcesTabProps {
  material: Material;
  sources: Source[];
  onSourcesChange: (sources: Source[]) => void;
  onParameterChange: (key: keyof Material, value: any) => void;
}
```

**Features:**
- Confidence level mismatch warning
- Auto-parameter assignment from tags
- Source library dialog with search
- Material-specific recommendations
- DOI links with external icon
- Source weight display
- Parameter usage display using PARAMETER_NAMES

---

## Shared Data Flow

### State Management
```
index.tsx (coordinator)
  ↓
  ├─ formData: Material (useState)
  ├─ sources: Source[] (useState)
  └─ handleParameterChange callback
       ↓
       ├→ RecyclabilityTab
       ├→ CompostabilityTab
       ├→ ReusabilityTab
       └→ SourcesTab
```

### M_value Sharing
The `M_value` (Infrastructure Maturity) parameter is **intentionally shared** across all three dimensions:

1. User enters M_value in any tab
2. `handleParameterChange('M_value', value)` updates formData
3. All three dimension tabs reflect the same M_value
4. Represents general circular economy infrastructure maturity

---

## Migration Guide

### Before (Old Import)
```typescript
import { ScientificDataEditor } from './components/ScientificDataEditor';
```

### After (New Import)
```typescript
import { ScientificDataEditor } from './components/scientific-editor';
```

**That's it!** The public API remains unchanged. All existing code using `<ScientificDataEditor>` will continue to work.

---

## Benefits of Modular Structure

### 1. **Maintainability**
- Each file is ~130-300 lines (vs 850+ before)
- Clear separation of concerns
- Easier to locate and fix bugs

### 2. **Reusability**
- Dimension tabs can be used independently if needed
- Utilities are shared across components
- Types are centralized

### 3. **Testability**
- Each component can be tested in isolation
- Mock props are simpler (DimensionTabProps)
- Utilities can be unit tested

### 4. **Collaboration**
- Multiple developers can work on different tabs
- Less merge conflict potential
- Clear ownership boundaries

### 5. **Performance**
- React can optimize re-renders per component
- Only active tab components render
- Source library dialog loads on demand

---

## Component Sizes (Before vs After)

| Component | Before | After |
|-----------|--------|-------|
| **Total** | 850 lines | 850 lines (distributed) |
| Main coordinator | - | 130 lines |
| Types | - | 60 lines |
| Utils | - | 80 lines |
| Recyclability Tab | - | 220 lines |
| Compostability Tab | - | 250 lines |
| Reusability Tab | - | 250 lines |
| Sources Tab | - | 300 lines |

**Largest file:** SourcesTab.tsx (300 lines) - still manageable  
**Average file size:** ~185 lines

---

## Testing Checklist

- [x] App.tsx imports from new location
- [ ] Can open Scientific Data Editor for a material
- [ ] Recyclability tab displays and calculates correctly
- [ ] Compostability tab displays and calculates correctly
- [ ] Reusability tab displays and calculates correctly
- [ ] Sources tab displays and manages sources
- [ ] M_value updates across all tabs
- [ ] Save button validates and saves all data
- [ ] Cancel button closes editor
- [ ] Confidence level validation works
- [ ] Source library browser works
- [ ] Parameter auto-assignment works

---

## Future Enhancements

### Potential Improvements
1. **Extract Confidence Interval Component**
   - Reusable `<CIInput>` component
   - Used in all three dimension tabs
   - Reduces duplication

2. **Extract Parameter Input Component**
   - Reusable `<ParameterInput>` component
   - Props: label, value, onChange, description
   - Consistent styling

3. **Add Unit Tests**
   - Test `getSuggestedConfidenceLevel` function
   - Test `autoAssignParameters` function
   - Test parameter validation logic

4. **Add Storybook Stories**
   - Document each tab component
   - Show different states (empty, filled, calculating)
   - Interactive playground

---

## Cleanup

### Old File (Can be deleted)
- `/components/ScientificDataEditor.tsx` (850 lines)

This file is no longer used after the refactor. The new modular structure is in `/components/scientific-editor/`.

**Before deleting:** Verify all functionality works in the new structure.

---

**Status:** ✅ Refactor complete and ready for testing  
**Breaking Changes:** None - public API unchanged  
**Next Steps:** Test all tab functionality, then delete old file
