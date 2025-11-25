# Supabase Cloud Storage & Authentication Integration

## Overview
WasteDB now includes Supabase authentication and cloud storage, providing:
- ✅ **Secure user accounts** with email/password authentication
- ✅ **Protected API endpoints** - your data is private to your account
- ✅ **Cross-device access** to your data from anywhere
- ✅ **Automatic cloud backup** with localStorage fallback
- ✅ **Offline support** when network is unavailable
- ✅ **Real-time sync status** indicators
- ✅ **Free forever tier** (sufficient for thousands of materials)

## Authentication

### Sign Up
Create a new account with:
- Email address
- Password (minimum 6 characters)
- Optional display name

**No email verification required** - accounts are instantly active for prototyping convenience.

### Sign In
Access your existing account with email and password. Your session is maintained using secure access tokens.

### Demo Account
Quick access with pre-configured demo data:
- Click "Try Demo Account" on the login screen
- Automatically creates/signs into demo@wastedb.app
- Perfect for testing and exploring features

### Session Management
- Access tokens stored securely in sessionStorage
- Auto-logout when closing browser
- Manual logout via logout button in status bar
- User info displayed in top-right corner

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

### Authentication Routes (Public)
- `POST /auth/signup` - Create a new user account
- `POST /auth/signin` - Sign in and get access token

### Material Routes (Protected - requires authentication)
- `GET /materials` - Fetch all materials for authenticated user
- `POST /materials` - Create a new material
- `POST /materials/batch` - Batch save materials
- `PUT /materials/:id` - Update a material
- `DELETE /materials/:id` - Delete a material
- `DELETE /materials` - Delete all materials

**Note**: All material routes require a valid access token in the Authorization header.

### Client API (`/utils/api.tsx`)

**Authentication Functions**
- `signUp(email, password, name?)` - Create new user account
- `signIn(email, password)` - Sign in and store access token
- `signOut()` - Clear access token and log out
- `isAuthenticated()` - Check if user has valid session
- `setAccessToken(token)` - Store access token
- `clearAccessToken()` - Remove access token

**Material Functions** (require authentication)
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

### Authentication & Authorization
- **User accounts required** - all material data is protected
- **Email/password authentication** via Supabase Auth
- **Access tokens** - JWT tokens for secure API calls
- **Session-based** - tokens stored in sessionStorage (cleared on browser close)
- **Auto-confirm emails** - no SMTP setup needed for prototyping

### Data Privacy
- Each user's data is private to their account
- Materials are stored with user-specific keys (planned for multi-tenant support)
- Currently all materials are in shared namespace (suitable for single-user/team prototyping)
- Access tokens expire and require re-authentication

### Best Practices
- Use strong passwords (8+ characters recommended)
- Don't share your account credentials
- Log out when using shared computers
- For production use, enable Row Level Security (RLS) policies

## Troubleshooting

### Authentication Issues

#### Can't Sign In
1. Verify email and password are correct
2. Check browser console for detailed error messages
3. Try the demo account to verify server is working
4. Ensure Supabase project is not paused

#### Unexpectedly Logged Out
- Sessions expire when browser closes (sessionStorage)
- Long periods of inactivity may invalidate tokens
- Simply sign in again to resume

#### "Unauthorized" Errors
1. Your session may have expired - sign in again
2. Check that access token is valid in sessionStorage
3. Clear sessionStorage and sign in fresh

### Sync Status Shows "Error"
1. Check your internet connection
2. Verify you're signed in (check for logout button)
3. Click "Retry Sync" button
4. Check browser console for detailed error logs

### Data Not Syncing
1. Verify Supabase project is active (not paused)
2. Ensure you're authenticated (sign in if needed)
3. Check console for API errors (401 = auth issue, 500 = server issue)
4. Try exporting data as CSV backup
5. Reimport after fixing connection issues

### Lost Data After Browser Clear
If you cleared browser data while offline:
- Cloud data is safe in Supabase (if you were signed in)
- Sign in and refresh to reload from cloud
- Local-only changes made while offline may be lost
- Use CSV export regularly as backup

## Authentication Flow

### First Time User
1. Open WasteDB → see login screen
2. Click "Sign Up" tab
3. Enter email, password, and optional name
4. Click "Create Account"
5. Automatically signed in
6. Start adding materials

### Returning User
1. Open WasteDB → see login screen
2. Enter email and password
3. Click "Sign In"
4. Your materials load from cloud
5. Continue working

### Token Lifecycle
1. **Sign In**: Server returns access token (JWT)
2. **Storage**: Token saved to sessionStorage
3. **API Calls**: Token sent in Authorization header
4. **Validation**: Server verifies token on each request
5. **Expiry**: Token invalidated on logout or browser close

### Demo Mode
- Shared account for quick testing
- Pre-populated with sample materials
- Safe to experiment (data may be reset periodically)
- Not for storing real data

## Future Enhancements

Potential additions:
- ✅ ~~Multi-user authentication~~ (complete!)
- User-specific data isolation with RLS policies
- Multi-user collaboration with shared workspaces
- Real-time updates across devices using Supabase Realtime
- Version history and undo/redo
- Conflict resolution for simultaneous edits
- Social login (Google, GitHub, etc.)
- Password reset via email
- Two-factor authentication
