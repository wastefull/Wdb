# Supabase Cloud Storage Integration

## Overview
WasteDB now syncs all material data to Supabase cloud storage, providing:
- ✅ Cross-device access to your data
- ✅ Automatic cloud backup
- ✅ Offline support with localStorage fallback
- ✅ Real-time sync status indicators
- ✅ Free forever tier (sufficient for thousands of materials)

## How It Works

### Data Flow
1. **On Load**: App attempts to load materials from Supabase
   - If Supabase is available → loads from cloud and caches locally
   - If Supabase is unavailable → loads from localStorage (offline mode)

2. **On Save**: All changes sync to both locations
   - Saves to localStorage immediately (instant feedback)
   - Syncs to Supabase in background (cloud backup)
   - Shows sync status in UI

3. **Error Handling**: 
   - If Supabase is down, app works offline
   - Data is saved to localStorage
   - "Retry Sync" button appears to resync when connection is restored

### Sync Status Indicators
Located in the top-right of the status bar:
- 🔵 **Cloud icon (blue)**: Successfully synced to cloud
- 🟡 **Cloud icon (pulsing yellow)**: Currently syncing...
- ⚪ **Cloud-off icon (gray)**: Working offline
- 🔴 **Cloud-off icon (red)**: Sync error - data saved locally

### Storage Backend
- Uses Supabase Key-Value store (built on PostgreSQL)
- Each material stored with key: `material:{id}`
- Supports batch operations for efficient bulk imports/exports
- No migration needed - works with existing localStorage data

## API Endpoints

### Server Routes (`/supabase/functions/server/index.tsx`)
- `GET /materials` - Fetch all materials
- `POST /materials` - Create a new material
- `POST /materials/batch` - Batch save materials
- `PUT /materials/:id` - Update a material
- `DELETE /materials/:id` - Delete a material
- `DELETE /materials` - Delete all materials

### Client API (`/utils/api.tsx`)
- `getAllMaterials()` - Fetch all materials from Supabase
- `saveMaterial(material)` - Save single material
- `batchSaveMaterials(materials)` - Save multiple materials
- `updateMaterial(material)` - Update existing material
- `deleteMaterial(id)` - Delete material by ID
- `deleteAllMaterials()` - Clear all data

## Cost Breakdown

### Free Tier (Forever)
- **Database**: 500 MB storage
- **Bandwidth**: 500 MB/month transfer
- **Users**: 50,000 monthly active users
- **API Requests**: Unlimited

### Estimated Usage for WasteDB
- Each material: ~1-2 KB (including articles)
- 1,000 materials: ~2 MB storage
- 10,000 materials: ~20 MB storage
- **Typical usage stays well within free tier limits**

### Inactivity Pause
- Projects pause after 1 week of inactivity
- First request after pause takes 1-2 seconds to wake up
- All data is preserved during pause

## Offline Mode

When Supabase is unavailable (network issues, maintenance, etc.):
1. App automatically switches to offline mode
2. All data is saved to localStorage only
3. Yellow banner appears with "Retry Sync" button
4. Click "Retry Sync" to push local changes to cloud when connection restores

## Migration from localStorage

No action needed! The app:
1. Checks Supabase first on load
2. If Supabase is empty but localStorage has data, uses localStorage
3. Next save will sync localStorage data to Supabase automatically

## Technical Details

### Data Structure
Materials are stored exactly as they appear in the app:
```typescript
{
  id: string;
  name: string;
  category: string;
  compostability: number;
  recyclability: number;
  reusability: number;
  description?: string;
  articles: {
    compostability: Article[];
    recyclability: Article[];
    reusability: Article[];
  };
}
```

### Error Handling
- Network errors → switch to offline mode
- Supabase errors → logged to console, toast notification shown
- Local changes never lost → always saved to localStorage first
- Background sync doesn't block UI operations

### Performance
- Initial load: Single batch fetch of all materials
- Updates: Individual material syncs (debounced)
- Bulk imports: Single batch operation
- No polling - saves bandwidth

## Security

- API calls use public anon key (read/write access)
- No authentication required (prototyping use case)
- Data is public within your Supabase project
- Not recommended for sensitive/personal data

## Troubleshooting

### Sync Status Shows "Error"
1. Check your internet connection
2. Click "Retry Sync" button
3. Check browser console for detailed error logs

### Data Not Syncing
1. Verify Supabase project is active (not paused)
2. Check console for API errors
3. Try exporting data as CSV backup
4. Reimport after fixing connection issues

### Lost Data After Browser Clear
If you cleared browser data while offline:
- Cloud data is safe in Supabase
- Refresh page to reload from cloud
- If still offline, wait for connection to restore

## Future Enhancements

Potential additions:
- Multi-user collaboration
- Real-time updates across devices
- User authentication and private workspaces
- Version history and undo/redo
- Conflict resolution for simultaneous edits
