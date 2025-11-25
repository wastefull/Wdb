# Source Library Manager - Troubleshooting Guide

## Quick Diagnostic Checklist

If you're experiencing errors when accessing the Source Library Manager (SLM), follow these steps:

### 1. Check Browser Console

Open browser DevTools (F12) and check the Console tab for error messages. Common errors:

#### Error: "Failed to fetch sources"

**Cause:** Backend endpoint not responding
**Solution:**

- Verify the backend server is running
- Check Network tab for failed requests to `/sources`
- Verify `projectId` and `publicAnonKey` are set correctly

#### Error: "Admin access required"

**Cause:** User doesn't have admin role
**Solution:**

- Verify you're signed in as natto@wastefull.org
- Check backend logs to confirm admin role is set
- Try signing out and signing back in

#### Error: "Cannot read property 'X' of undefined"

**Cause:** Missing props or data structure mismatch
**Solution:**

- Check that all required props are passed to SourceLibraryManager
- Verify the Source interface matches between frontend and backend

### 2. Check Network Tab

Look for failed API requests:

```
GET  /make-server-17cae920/sources
POST /make-server-17cae920/sources
PUT  /make-server-17cae920/sources/:id
DELETE /make-server-17cae920/sources/:id
POST /make-server-17cae920/sources/batch
```

### 3. Verify Authentication

The SLM requires:

- **Read Operations:** No authentication required (public)
- **Write Operations:** Admin authentication required

To verify authentication:

1. Open DevTools > Application > Session Storage
2. Check for `wastedb_access_token`
3. Verify it's not the anon key

### 4. Test Backend Endpoints Directly

#### Test GET /sources (Public)

```bash
curl -X GET \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/sources \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Expected Response:

```json
{
  "sources": []
}
```

#### Test POST /sources (Admin)

```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/sources \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "X-Session-Token: YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-source-1",
    "title": "Test Source",
    "type": "peer-reviewed",
    "weight": 1.0
  }'
```

Expected Response:

```json
{
  "source": {
    "id": "test-source-1",
    "title": "Test Source",
    "type": "peer-reviewed",
    "weight": 1.0
  }
}
```

### 5. Common Issues & Solutions

#### Issue: "Sources not loading"

**Symptoms:** Loading spinner never stops, no sources appear
**Debugging:**

1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify `loadSourcesFromCloud()` is called
4. Check if `getAllSources()` is imported from `../utils/api`

**Solution:**

```typescript
// In SourceLibraryManager.tsx
useEffect(() => {
  loadSourcesFromCloud();
}, []);

const loadSourcesFromCloud = async () => {
  try {
    setLoading(true);
    const cloudSources = await api.getAllSources();
    console.log("Loaded sources:", cloudSources); // Add this log

    if (cloudSources.length > 0) {
      setSources(cloudSources);
      setCloudSynced(true);
    } else {
      setSources([...SOURCE_LIBRARY]);
      setCloudSynced(false);
    }
  } catch (error) {
    console.error("Failed to load sources from cloud:", error);
    toast.error("Failed to load sources from cloud");
    setSources([...SOURCE_LIBRARY]);
    setCloudSynced(false);
  } finally {
    setLoading(false);
  }
};
```

#### Issue: "Cannot add/edit/delete sources"

**Symptoms:** CRUD operations fail with 401/403 errors
**Debugging:**

1. Verify you're signed in as admin
2. Check `isAuthenticated` and `isAdmin` props
3. Verify access token is being sent

**Solution:**

```typescript
// Verify props in App.tsx
<SourceLibraryManager
  onBack={navigateToMaterials}
  materials={materials}
  isAuthenticated={!!user} // Must be true
  isAdmin={userRole === "admin"} // Must be true for admin
/>
```

#### Issue: "Props mismatch error"

**Symptoms:** TypeScript errors about missing props
**Debugging:**

1. Check SourceLibraryManager prop interface
2. Verify all required props are passed

**Solution:**

```typescript
// Required props interface
interface SourceLibraryManagerProps {
  onBack: () => void;
  materials: Material[];
  isAuthenticated: boolean;
  isAdmin: boolean;
}
```

### 6. Integration Points

The SLM is integrated in TWO places:

#### A. Data Management Tab (Admin)

**Location:** App.tsx → Data Management View → "Sources" tab
**Access:** Admin only, via Data Management navigation
**Props:**

```typescript
<SourceLibraryManager
  onBack={() => {}} // Empty since we're in a tab
  materials={materials}
  isAuthenticated={!!user}
  isAdmin={userRole === "admin"}
/>
```

#### B. Standalone View

**Location:** App.tsx → currentView.type === 'source-library'
**Access:** Via `navigateToSourceLibrary()`
**Props:**

```typescript
<SourceLibraryManager
  onBack={navigateToMaterials}
  materials={materials}
  isAuthenticated={!!user}
  isAdmin={userRole === "admin"}
/>
```

### 7. Backend Verification

Check that backend endpoints are properly defined in `/supabase/functions/server/index.tsx`:

```typescript
// Line ~2027
app.get("/make-server-17cae920/sources", async (c) => {
  try {
    const sources = await kv.getByPrefix("source:");
    return c.json({ sources: sources || [] });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return c.json(
      { error: "Failed to fetch sources", details: String(error) },
      500
    );
  }
});

// Line ~2038
app.post(
  "/make-server-17cae920/sources",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    // ... endpoint code
  }
);

// Line ~2053
app.put(
  "/make-server-17cae920/sources/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    // ... endpoint code
  }
);

// Line ~2073
app.delete(
  "/make-server-17cae920/sources/:id",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    // ... endpoint code
  }
);

// Line ~2085
app.post(
  "/make-server-17cae920/sources/batch",
  verifyAuth,
  verifyAdmin,
  async (c) => {
    // ... endpoint code
  }
);
```

### 8. Data Flow Diagram

```
┌─────────────────────────────────────────────┐
│ SourceLibraryManager Component              │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ useEffect(() => {                  │    │
│  │   loadSourcesFromCloud()           │    │
│  │ }, [])                             │    │
│  └────────────────┬───────────────────┘    │
│                   │                         │
│                   ▼                         │
│  ┌────────────────────────────────────┐    │
│  │ api.getAllSources()                │    │
│  └────────────────┬───────────────────┘    │
└───────────────────┼─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ /utils/api.tsx                              │
│                                             │
│  export async function getAllSources() {    │
│    const response = await fetch(            │
│      `${API_BASE_URL}/sources`,            │
│      {                                      │
│        headers: {                           │
│          'Authorization': `Bearer ${...}`,  │
│        }                                    │
│      }                                      │
│    );                                       │
│    return response.json().sources;          │
│  }                                          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ Backend: /supabase/functions/server/        │
│                                             │
│  app.get('/make-server-17cae920/sources',  │
│    async (c) => {                          │
│      const sources = await kv.getByPrefix( │
│        'source:'                            │
│      );                                     │
│      return c.json({ sources });            │
│    }                                        │
│  );                                         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ KV Store (Supabase)                         │
│                                             │
│  Keys: source:paper-recycling-epa-2021     │
│        source:glass-infinite-recycling-2020 │
│        ...                                  │
└─────────────────────────────────────────────┘
```

### 9. Enable Debug Logging

Add this to the beginning of SourceLibraryManager component:

```typescript
export function SourceLibraryManager({ onBack, materials, isAuthenticated, isAdmin }: SourceLibraryManagerProps) {
  // DEBUG LOGGING
  useEffect(() => {
    console.log('=== SOURCE LIBRARY DEBUG ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('isAdmin:', isAdmin);
    console.log('materials count:', materials.length);
    console.log('onBack type:', typeof onBack);
  }, [isAuthenticated, isAdmin, materials, onBack]);

  // ... rest of component
```

### 10. Contact Support

If none of the above solutions work, please provide:

1. **Exact error messages** from browser console
2. **Network tab screenshot** showing failed requests
3. **Current auth state** (signed in email, role)
4. **Backend logs** if accessible
5. **Steps to reproduce** the error

## Quick Fixes

### Fix 1: Force Refresh Sources

```typescript
// In SourceLibraryManager, add a refresh button
<Button onClick={loadSourcesFromCloud}>
  <RefreshCw className="w-4 h-4 mr-2" />
  Refresh Sources
</Button>
```

### Fix 2: Clear and Re-initialize

```typescript
// Reset to default library
const handleReset = () => {
  setSources([...SOURCE_LIBRARY]);
  setCloudSynced(false);
  toast.success("Reset to default library");
};
```

### Fix 3: Manual Sync

```typescript
// Force sync current sources to cloud
const handleForceSync = async () => {
  if (!isAuthenticated || !isAdmin) {
    toast.error("Admin access required");
    return;
  }

  try {
    await api.batchSaveSources(sources);
    toast.success(`${sources.length} sources synced`);
    setCloudSynced(true);
  } catch (error) {
    console.error("Sync failed:", error);
    toast.error("Sync failed: " + error.message);
  }
};
```

---

## Still Having Issues?

**Please share the specific error messages you're seeing** so I can provide targeted solutions!
