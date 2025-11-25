# WasteDB Refactoring - Phase 1: Context Extraction

**Date:** October 28, 2025  
**Status:** Infrastructure Complete - Ready for App.tsx Integration

## What We've Built

### 1. Logger Infrastructure ✅

- **File:** `/utils/loggerFactories.ts`
- **Purpose:** Context-specific loggers with scoped prefixes
- **Loggers Available:**
  - `materialsLogger` - Materials CRUD and data operations
  - `authLogger` - Authentication and session management
  - `syncLogger` - localStorage ↔ Supabase sync
  - `apiLogger` - HTTP requests
  - `navigationLogger` - View changes and routing
  - `articlesLogger` - Article management
  - `sourcesLogger` - Source library operations
  - `submissionsLogger` - Submission and review workflow
  - `userLogger` - User management and roles
  - `scientificLogger` - Scientific calculations
  - `whitepaperLogger` - Whitepaper operations
  - `a11yLogger` - Accessibility controls
  - `emailLogger` - Email notifications

**Key Feature:** All loggers respect `TEST_MODE` from core logger - nothing leaks to production console.

### 2. Context Architecture ✅

#### MaterialsContext (`/contexts/MaterialsContext.tsx`)

**Manages:**

- Materials state (`materials`, `isLoadingMaterials`)
- Sync state (`syncStatus`, `supabaseAvailable`)
- CRUD operations (`addMaterial`, `updateMaterial`, `deleteMaterial`)
- Batch operations (`bulkImport`, `updateMaterials`, `deleteAllMaterials`)
- Sync operations (`retrySync`)
- Sample data initialization

**Dependencies:** Requires `user` and `userRole` as props

#### AuthContext (`/contexts/AuthContext.tsx`)

**Manages:**

- User state (`user`, `userRole`, `isAuthenticated`)
- Session persistence (sessionStorage)
- Auth operations (`signIn`, `signOut`)
- Role management (`updateUserRole`)

**Independent:** No dependencies on other contexts

#### NavigationContext (`/contexts/NavigationContext.tsx`)

**Manages:**

- Current view state (`currentView`)
- View history (for back navigation)
- Navigation helpers (typed navigation functions)
- All view types centralized in `ViewType`

**Independent:** No dependencies on other contexts

## Current File Structure

```
contexts/
  ├── AuthContext.tsx          ✅ Created
  ├── MaterialsContext.tsx     ✅ Created
  └── NavigationContext.tsx    ✅ Created

utils/
  ├── logger.ts                ✅ Existing
  ├── loggerFactories.ts       ✅ Created
  ├── api.tsx                  ⏳ Needs logger migration
  ├── dataMigration.ts         ⏳ Needs logger migration
  └── supabase/info.tsx        ✅ No changes needed
```

## Next Steps: Integrating with App.tsx

### Step 1: Wrap App with Providers

```tsx
// In App.tsx
import { AuthProvider } from "./contexts/AuthContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { MaterialsProvider } from "./contexts/MaterialsContext";

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AuthAwareMaterialsProvider>
          {/* Rest of app */}
        </AuthAwareMaterialsProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

// Helper component to bridge auth context to materials provider
const AuthAwareMaterialsProvider = ({ children }) => {
  const { user, userRole } = useAuthContext();
  return (
    <MaterialsProvider user={user} userRole={userRole}>
      {children}
    </MaterialsProvider>
  );
};
```

### Step 2: Replace Local State with Context Hooks

**Replace in App.tsx:**

- `const [user, setUser] = useState(...)` → `const { user, signIn, signOut } = useAuthContext()`
- `const [userRole, setUserRole] = useState(...)` → `const { userRole } = useAuthContext()`
- `const [materials, setMaterials] = useState(...)` → `const { materials, addMaterial, ... } = useMaterialsContext()`
- `const [currentView, setCurrentView] = useState(...)` → `const { currentView, navigateTo, ... } = useNavigationContext()`

### Step 3: Remove Duplicate Logic from App.tsx

**Delete from App.tsx (now in contexts):**

- `initializeSampleData()` function
- `loadFromLocalStorage()` function
- `saveMaterials()` function
- `handleAddMaterial()` function
- `handleUpdateMaterial()` function
- `handleDeleteMaterial()` function
- `bulkImport()` logic
- `retrySync()` function
- All auth initialization logic
- All materials loading useEffects

### Step 4: Update Component Props

**Components that receive these props need updating:**

- `<DataManagementView>` - use context hooks instead of props
- `<MaterialDetailView>` - use context hooks instead of props
- All other views - gradually migrate to context hooks

## Benefits

### Before Refactoring

- **App.tsx:** 3600+ lines
- **State Logic:** Scattered throughout App.tsx
- **Debugging:** Hard to trace state changes
- **Reusability:** Logic tied to App.tsx

### After Refactoring

- **App.tsx:** ~1000-1500 lines (just layout + routing)
- **State Logic:** Organized in contexts by domain
- **Debugging:** Scoped logging makes issues easy to trace
- **Reusability:** Contexts can be used anywhere
- **Testing:** Each context can be tested independently

## Console Logging Security

✅ **All logging infrastructure respects TEST_MODE**

- Production: No logs (TEST_MODE = false by default)
- Development (Figma Make): Full logs (TEST_MODE = true by default)
- Manual override: `setTestMode(true/false)` available

**Verification:**

```typescript
// In browser console to check current mode:
import { logger } from "./utils/logger";
logger.loggerInfo();

// To disable all logging:
logger.setTestMode(false);
```

## Migration Strategy

### Phase 1A (Current - Infrastructure Ready) ✅

- Created all context files
- Created logger factories
- **No breaking changes yet**

### Phase 1B (Next - Integration)

- Wrap App.tsx with providers
- Replace local state with context hooks
- Remove duplicate logic
- **Testing required after this step**

### Phase 1C (Cleanup)

- Migrate remaining components to use contexts
- Remove legacy prop drilling
- Update component interfaces

## Rollback Plan

If issues arise during integration:

1. All new files are additive - can be ignored
2. App.tsx changes can be reverted via git
3. No database or API changes required
4. Contexts are optional - App.tsx still works standalone

## Questions for User

Before proceeding with Phase 1B integration:

1. **Should we proceed with wrapping App.tsx with the new contexts?**
2. **Do you want to test each context individually first?**
3. **Are there any specific parts of App.tsx you want to preserve as-is?**
4. **Should we migrate components to use contexts immediately, or keep prop-based approach temporarily?**
