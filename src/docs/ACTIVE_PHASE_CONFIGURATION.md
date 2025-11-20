# Active Phase Configuration Guide

## Overview

The WasteDB development infrastructure now includes a centralized phase configuration system that allows you to easily switch between development phases without manually updating multiple files.

## How It Works

### Configuration File: `/config/phaseConfig.ts`

This file contains a single source of truth for which phase is currently active in development:

```typescript
export const PHASE_CONFIG: PhaseConfig = {
  activePhase: '9.1',
  displayName: 'Phase 9.1: Evidence Points & Aggregations',
  description: 'Database infrastructure for evidence-based material parameters using Minimally Interpretive Units (MIUs)',
  tabId: '9.1',
  menuLabel: 'Phase 9.1',
};
```

### What Gets Updated Automatically

When you change the `PHASE_CONFIG`, the following UI elements update automatically:

1. **Default Tab in Roadmap** (`SimplifiedRoadmap.tsx`)
   - The `defaultTab` prop uses `PHASE_CONFIG.tabId`
   - Opening the Roadmap page will default to showing the active phase tab

2. **Active Phase Tab Content** (`SimplifiedRoadmap.tsx`)
   - The tab matching `PHASE_CONFIG.tabId` shows the test console
   - This is determined by: `{PHASE_CONFIG.tabId === '9.1' && <Phase91Tests />}`

3. **Admin Dashboard Menu Link** (`AdminDashboard.tsx`)
   - The menu item under Admin > Testing > Roadmap
   - Uses `PHASE_CONFIG.menuLabel` for the link text
   - Navigates to `PHASE_CONFIG.tabId` when clicked

## Making Changes

### Switching to a New Phase

To switch development focus to a new phase (e.g., Phase 9.2):

1. **Update `/config/phaseConfig.ts`:**
   ```typescript
   export const PHASE_CONFIG: PhaseConfig = {
     activePhase: '9.2',
     displayName: 'Phase 9.2: Curation Workbench UI',
     description: 'User interface for evidence curation and validation',
     tabId: '9.2',
     menuLabel: 'Phase 9.2',
   };
   ```

2. **Create the test component** (e.g., `/components/Phase92Tests.tsx`)
   - Follow the pattern from `Phase91Tests.tsx`
   - This component will contain all the tests for Phase 9.2

3. **Update SimplifiedRoadmap.tsx:**
   ```typescript
   import { Phase92Tests } from './Phase92Tests';
   
   // In the tab content for '9.2':
   {activeTab === '9.2' && (
     <div className="space-y-8">
       <Card className="border-2">
         {/* Phase description */}
       </Card>
       
       {/* Show testing console in active phase tab */}
       {PHASE_CONFIG.tabId === '9.2' && (
         <Phase92Tests />
       )}
     </div>
   )}
   ```

That's it! The menu link and default tab will update automatically.

## Generic Testing Infrastructure

### GenericPhaseTestConsole Component

For future phases, you can use the `GenericPhaseTestConsole` component to create a standardized testing interface:

```typescript
import { GenericPhaseTestConsole } from './GenericPhaseTestConsole';

const phase92Tests = [
  {
    id: 'phase92-test-1',
    name: 'Test Name',
    description: 'Test description',
    phase: '9.2',
    category: 'Category Name',
    testFn: async () => {
      // Test logic
      return { success: true, message: 'Test passed!' };
    },
  },
  // More tests...
];

// In your component:
<GenericPhaseTestConsole phase="9.2" tests={phase92Tests} />
```

This component provides:
- Automatic test categorization
- Run individual or all tests
- Real-time status updates
- Statistics tracking
- Category filtering

## Benefits

✅ **Single Source of Truth** - Change one file to update everything  
✅ **No Manual Coordination** - No need to update multiple components  
✅ **Developer-Friendly** - Easy to switch between phases during development  
✅ **Scalable** - Works for any number of future phases  
✅ **Type-Safe** - TypeScript ensures correct configuration

## Example Workflow

### Scenario: You're working on Phase 9.2 and want to test Phase 9.1

1. Keep `PHASE_CONFIG.activePhase = '9.1'` in `/config/phaseConfig.ts`
2. Go to Admin Dashboard → Testing → Roadmap → Phase 9.1
3. The page opens with the 9.1 tab active and shows the test console
4. Run your tests

### Scenario: You're ready to start Phase 9.2

1. Update `/config/phaseConfig.ts` to set `activePhase: '9.2'`
2. Create `/components/Phase92Tests.tsx`
3. Add the test console to the 9.2 tab in `SimplifiedRoadmap.tsx`
4. The menu automatically shows "Phase 9.2" and navigates to the 9.2 tab

## File Locations

- **Configuration:** `/config/phaseConfig.ts`
- **Roadmap UI:** `/components/SimplifiedRoadmap.tsx`
- **Admin Menu:** `/components/AdminDashboard.tsx`
- **Test Components:** `/components/Phase[X]Tests.tsx`
- **Generic Test Console:** `/components/GenericPhaseTestConsole.tsx`

## Notes

- The "Tests" tab in the Roadmap shows the unified TestSuite component (all 48 tests from Phase 9.0)
- Individual phase tabs (9.1, 9.2, etc.) show phase-specific test consoles
- The Phase 9.0 link remains separate since it's a legacy view
