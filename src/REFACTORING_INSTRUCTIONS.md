# Manual App.tsx Refactoring Instructions

## Overview

You have extracted component files ready in these folders:

- `/components/search/` (SearchIcon, SearchBar)
- `/components/charts/` (ScoreBar, ClickableChartLabel)
- `/components/layout/` (AdminModeButton, RetroButtons, StatusBar)
- `/components/cards/` (MaterialCard, ArticleCard)
- `/components/forms/` (ImageUploadArea, MaterialForm, ArticleForm)
- `/components/views/` (ArticlesView, MaterialDetailView, AllArticlesView, RecyclabilityCalculationView, StandaloneArticleView, DataManagementView)

## Step 1: Add Imports (done)

Find this line in `App.tsx` (around line 168):

```tsx
import { ErrorBoundary } from "./components/ErrorBoundary";
```

Add these imports immediately after it:

```tsx
import { SearchBar } from "./components/search";
import { ScoreBar, ClickableChartLabel } from "./components/charts";
import { AdminModeButton, RetroButtons, StatusBar } from "./components/layout";
import { MaterialCard, ArticleCard } from "./components/cards";
import { MaterialForm, ArticleForm, ImageUploadArea } from "./components/forms";
import {
  ArticlesView,
  MaterialDetailView,
  AllArticlesView,
  RecyclabilityCalculationView,
  StandaloneArticleView,
  DataManagementView,
} from "./components/views";
```

## Step 2: Delete Inline Component Definitions (done)

Delete the following function blocks (find each `function FunctionName({` and delete through its closing `}`):

| Function                     | Approx Lines | Search For                                |
| ---------------------------- | ------------ | ----------------------------------------- |
| AdminModeButton     x        | 170-205      | `function AdminModeButton({`              |
| RetroButtons        x        | 206-350      | `function RetroButtons({`                 |
| SearchIcon          x        | 351-385      | `function SearchIcon()`                   |
| SearchBar           x        | 386-480      | `function SearchBar({`                    |
| ScoreBar            x        | 481-560      | `function ScoreBar({`                     |
| ClickableChartLabel x        | 561-640      | `function ClickableChartLabel({`          |
| StatusBar           x        | 641-750      | `function StatusBar({`                    |
| MaterialCard        x        | 751-940      | `function MaterialCard({`                 |
| MaterialForm        x        | 941-1200     | `function MaterialForm({`                 |
| ImageUploadArea     x        | 1201-1300    | `function ImageUploadArea({`              |
| ArticleCard         x        | 1301-1450    | `function ArticleCard({`                  |
| ArticleForm         x        | 1451-1678    | `function ArticleForm({`                  |
| ArticlesView        x        | 1679-1867    | `function ArticlesView({`                 |
| MaterialDetailView  x        | 1868-2080    | `function MaterialDetailView({`           |
| AllArticlesView     x        | 2081-2159    | `function AllArticlesView({`              |
| RecyclabilityCalculationViewx| 2160-2388    | `function RecyclabilityCalculationView({` |
| StandaloneArticleView  x     | 2389-2555    | `function StandaloneArticleView({`        |
| DataManagementView     x     | 2556-3264    | `function DataManagementView({`           |

**Tip:** Use your editor's "Go to Definition" or search to find each function, then select from `function FunctionName` through its final closing `}` (watch bracket matching) and delete.

## Step 3: Clean Up Unused Imports

After deleting the inline functions, remove any imports that are no longer used in App.tsx. Common ones to check:

- `Plus` from lucide-react (if only used in extracted components)
- `Edit2`, `Trash2` (if only in cards)
- `Upload`, `Image as ImageIcon` (if only in forms)
- Any others your editor flags as unused

## Step 4: Verify Build

```bash
npm run build
```

Fix any TypeScript errors that appear. Common issues:

- Missing exports from extracted files
- Type mismatches in props
- Circular dependencies

## Step 5: Test

```bash
npm run dev
```

Test each view manually to ensure components render correctly.

---

**Expected Result:** App.tsx should go from ~4329 lines to ~1100-1200 lines, containing only AppContent and the App wrapper function.

## Notes from Previous Session

- The extracted component files are already created and should be complete
- If you encounter import errors, check the barrel exports in each folder's `index.ts`
- The views depend on cards/forms components, so those imports are already set up in the view files
