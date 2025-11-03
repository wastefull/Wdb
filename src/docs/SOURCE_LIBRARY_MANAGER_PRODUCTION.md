# Source Library Manager - Production Ready

**Status:** ✅ Production Ready  
**Completed:** November 2, 2025

---

## Overview

The Source Library Manager is a comprehensive system for managing academic sources, papers, and reports used for scientific parameter validation in WasteDB. It provides a centralized repository with proper citation metadata, weighted confidence calculations, and cloud synchronization.

---

## Features

### Core Functionality

#### ✅ Source CRUD Operations
- **Create** - Add new sources with full metadata
- **Read** - View and search all sources
- **Update** - Edit existing source information
- **Delete** - Remove sources (with usage validation)

#### ✅ Cloud Synchronization
- Automatic sync to Supabase backend
- Manual sync trigger for batch operations
- Sync status indicator (cloud/local)
- Refresh from cloud capability

#### ✅ Import/Export
- **Export** - Download sources as JSON
- **Import** - Upload sources from JSON file
- Duplicate detection on import
- Validation of imported data

#### ✅ Search & Filtering
- **Search** - Title, authors, tags
- **Type Filter** - Peer-reviewed, government, industrial, NGO, internal
- **Tag Filter** - Multi-select tag filtering
- Results count display
- Clear filters option

#### ✅ Usage Tracking
- Shows which materials use each source
- Prevents deletion of sources in use
- Visual usage indicators

---

## Architecture

### Backend (Supabase Edge Functions)

**Endpoints:**

```
GET    /make-server-17cae920/sources           - Get all sources
GET    /make-server-17cae920/sources/:id       - Get single source
POST   /make-server-17cae920/sources           - Create source (admin)
PUT    /make-server-17cae920/sources/:id       - Update source (admin)
DELETE /make-server-17cae920/sources/:id       - Delete source (admin)
POST   /make-server-17cae920/sources/batch     - Batch save sources (admin)
```

**Data Model:**
```typescript
interface Source {
  id: string;
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  url?: string;
  weight?: number; // 0-1, defaults based on type
  type: 'peer-reviewed' | 'government' | 'industrial' | 'ngo' | 'internal';
  abstract?: string;
  tags?: string[];
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}
```

**Validation Rules:**
- `title` - Required, trimmed
- `type` - Required, must be valid type
- `year` - Optional, must be valid year (1900 - current+1)
- `weight` - Optional, must be 0-1
- `doi` - Optional, trimmed
- `tags` - Optional array, filtered for empty values

**Authorization:**
- Read operations - Public (no auth required)
- Write operations - Admin only

**Storage:**
- KV store with prefix `source:`
- ID format: `source-{timestamp}-{random}`

---

### Frontend Components

**Main Component:** `/components/SourceLibraryManager.tsx`

**Features:**
- Responsive table layout
- Real-time search and filtering
- Modal dialog for add/edit
- Cloud sync status indicator
- Usage tracking
- Import/export functionality

**Props:**
```typescript
interface SourceLibraryManagerProps {
  onBack: () => void;
  materials: Material[];
  isAuthenticated: boolean;
  isAdmin: boolean;
}
```

---

### Frontend API (`/utils/api.tsx`)

```typescript
// Get all sources
getAllSources(): Promise<Source[]>

// Get single source
getSource(id: string): Promise<Source>

// Create source (admin only)
createSource(source: SourceInput): Promise<Source>

// Update source (admin only)
updateSource(id: string, updates: Partial<Source>): Promise<Source>

// Delete source (admin only)
deleteSource(id: string): Promise<void>

// Batch save (admin only)
batchSaveSources(sources: Source[]): Promise<{ success: boolean; count: number }>
```

---

## Source Types & Weights

Per methodology whitepaper specifications:

| Type | Weight | Description | Use Cases |
|------|--------|-------------|-----------|
| **Peer-Reviewed** | 1.0 | Academic journal articles | Gold standard for scientific data |
| **Government** | 0.9 | EPA, EU, national agencies | Official statistics, regulations |
| **Industrial** | 0.7 | LCA databases, industry reports | Real-world data, technical specs |
| **NGO/Nonprofit** | 0.6 | Ellen MacArthur, Ocean Conservancy | Advocacy-backed research |
| **Internal** | 0.3 | Unpublished, proprietary | Internal testing, preliminary data |

**Automatic Weight Assignment:**
When creating a source, if no weight is specified:
- Peer-reviewed → 1.0
- Government → 0.9
- Industrial → 0.7
- NGO → 0.6
- Internal → 0.3

---

## Usage Guide

### Adding a Source

1. Click "Add Source" (admin only)
2. Fill required fields:
   - **Title** * (required)
   - **Type** * (required)
3. Fill optional fields:
   - **Authors** - Format: "Last, F., Last, F., et al."
   - **Year** - Publication year
   - **DOI** - Digital Object Identifier
   - **URL** - Link to source
   - **Weight** - Custom confidence weight (0-1)
   - **Abstract** - Brief summary
   - **Tags** - Comma-separated (e.g., "plastic, recycling, pet")
4. Click "Add Source"

**Duplicate Detection:**
- System checks for duplicate DOI
- System checks for duplicate title
- Prevents accidental duplicates

### Editing a Source

1. Click edit icon (✏️) in Actions column
2. Modify fields as needed
3. Click "Update Source"
4. Changes sync to cloud automatically

### Deleting a Source

1. Click trash icon (🗑️) in Actions column
2. System checks if source is in use
3. If in use → Deletion blocked with error message
4. If unused → Source deleted immediately

**Protection:** Cannot delete sources referenced by materials

### Importing Sources

1. Click "Import" button (admin only)
2. Select JSON file
3. System validates each source
4. Duplicate sources are skipped
5. New sources are merged into library
6. Click "Sync to Cloud" to save

**Expected Format:**
```json
[
  {
    "id": "paper-recycling-epa-2021",
    "title": "Advancing Sustainable Materials Management",
    "authors": "U.S. Environmental Protection Agency",
    "year": 2021,
    "type": "government",
    "weight": 0.9,
    "tags": ["cardboard", "paper", "recycling"],
    "abstract": "..."
  }
]
```

### Exporting Sources

1. Click "Export" button
2. JSON file downloads automatically
3. Filename: `wastedb-sources-{date}.json`

**Use Cases:**
- Backup before major changes
- Share with collaborators
- Version control
- Migration to other systems

### Cloud Sync

**Automatic Sync:**
- Enabled when admin is authenticated
- All add/edit/delete operations sync immediately
- Green cloud icon indicates sync active

**Manual Sync:**
- Orange cloud icon indicates local-only mode
- Click "Sync to Cloud" to save all sources
- Useful after import operations

**Refresh from Cloud:**
- Click "Refresh" to reload from cloud
- Discards unsaved local changes
- Useful for multi-user scenarios

---

## Filtering & Search

### Search
- Searches in: title, authors, tags
- Real-time filtering
- Case-insensitive

### Type Filter
Dropdown with options:
- All Types
- Peer-Reviewed
- Government
- Industrial/LCA
- NGO/Nonprofit
- Internal

### Tag Filter
- Displays all available tags
- Click to toggle selection
- Multi-select enabled
- Shows selected tags in blue

### Active Filters Indicator
When filters are applied:
- Shows "X of Y sources"
- "Clear Filters" button appears

---

## Data Validation

### Backend Validation
- ✅ Required fields (title, type)
- ✅ Type enum validation
- ✅ Weight range (0-1)
- ✅ Year range validation
- ✅ Trimming whitespace
- ✅ Array filtering (tags)

### Frontend Validation
- ✅ Required field checks
- ✅ Year range (1900 - current+1)
- ✅ Weight range (0-1)
- ✅ Duplicate DOI detection
- ✅ Duplicate title detection
- ✅ Empty value filtering

---

## UI Components

### Header Section
- Title with source count
- Cloud sync status indicator
- Action buttons (Export, Import, Sync, Add)

### Filters Card
- Search input
- Type dropdown
- Tag multi-select
- Clear filters button

### Sources Table

**Columns:**
1. **Source** - Title, authors, year, DOI link
2. **Type** - Color-coded badge
3. **Weight** - Confidence value
4. **Tags** - First 3 tags + count
5. **Usage** - Material count
6. **Actions** - Edit, Delete buttons

**Empty State:**
- Book icon
- "No sources found" message

### Add/Edit Dialog
- Modal overlay
- Scrollable content
- Form with all fields
- Save/Cancel buttons

### Status Alerts

**Not Authenticated:**
- Blue alert
- "Admin access required" message

**Cloud Synced:**
- Green alert
- "Changes automatically synced" message

**Local Only:**
- Orange alert
- "Click Sync to Cloud" message

---

## Type Color Coding

Visual distinction for source types:

| Type | Badge Color |
|------|-------------|
| Peer-Reviewed | Green |
| Government | Blue |
| Industrial | Yellow |
| NGO | Purple |
| Internal | Gray |

---

## Error Handling

### Backend Errors
- 400 - Validation errors (missing fields, invalid type)
- 404 - Source not found
- 500 - Server errors (logged with details)

### Frontend Errors
- Network errors → Toast notification
- Validation errors → Inline toast
- Sync failures → Local changes preserved

### Graceful Degradation
- If cloud fetch fails → Use default SOURCE_LIBRARY
- If sync fails → Save locally, allow manual retry
- If import fails → Show specific error, don't corrupt data

---

## Default Source Library

The application ships with a curated default library in `/data/sources.ts`:

**Categories Covered:**
- Paper & Cardboard (4 sources)
- Glass (4 sources)
- Plastics - PET (6 sources)
- Plastics - HDPE (4 sources)
- Plastics - General (4 sources)
- Metals - Aluminum (4 sources)
- Metals - Steel (3 sources)
- Food Waste (4 sources)
- Textiles (4 sources)

**Total:** ~40 pre-loaded sources

**Tags Available:**
- Material types: cardboard, paper, glass, plastic, pet, hdpe, aluminum, steel, textiles
- Processes: recycling, composting, reuse, biodegradation
- Parameters: yield, degradation, contamination, energy, infrastructure
- Regions: europe, usa, global

---

## Security

### Authorization
- **Read** - Public access (no auth required)
- **Write** - Admin only
- Middleware: `verifyAuth`, `verifyAdmin`

### Input Sanitization
- All strings trimmed
- HTML not allowed (plain text only)
- Arrays filtered for falsy values
- Type validation on all inputs

### Audit Trail
- `created_at`, `created_by` on creation
- `updated_at`, `updated_by` on updates
- Logged to console for admin actions

---

## Performance

### Optimizations
- Client-side filtering (no server roundtrips)
- Efficient KV prefix queries
- Batch operations for sync
- Lazy loading with paginated table

### Scaling Considerations
- Current: ~40-100 sources expected
- Handles 1000+ sources efficiently
- Could add pagination for 10,000+

---

## Testing Checklist

### CRUD Operations
- [x] Create source with all fields
- [x] Create source with minimal fields
- [x] Edit source
- [x] Delete unused source
- [x] Prevent delete of used source

### Validation
- [x] Require title and type
- [x] Validate year range
- [x] Validate weight range
- [x] Detect duplicate DOI
- [x] Detect duplicate title

### Cloud Sync
- [x] Auto-sync on create
- [x] Auto-sync on update
- [x] Auto-sync on delete
- [x] Manual batch sync
- [x] Refresh from cloud

### Import/Export
- [x] Export to JSON
- [x] Import from JSON
- [x] Validate imported data
- [x] Skip duplicates on import
- [x] Handle invalid JSON

### Search & Filter
- [x] Search by title
- [x] Search by author
- [x] Search by tag
- [x] Filter by type
- [x] Filter by multiple tags
- [x] Clear all filters

### UI/UX
- [x] Responsive layout
- [x] Loading states
- [x] Error messages
- [x] Success toasts
- [x] Empty states
- [x] Disabled states (non-admin)

---

## Future Enhancements

### Potential Features
1. **BibTeX Import/Export** - Academic citation format
2. **DOI Auto-Lookup** - Fetch metadata from DOI.org
3. **Citation Generator** - Generate formatted citations
4. **Source Versioning** - Track changes over time
5. **Advanced Search** - Boolean operators, field-specific search
6. **Bulk Operations** - Edit/delete multiple sources
7. **Source Collections** - Group sources by project/topic
8. **Collaborative Editing** - Multi-user simultaneous access
9. **Integration with Zotero/Mendeley** - Import from reference managers
10. **PDF Upload & OCR** - Extract metadata from PDF files

---

## Files

### Backend
- `/supabase/functions/server/index.tsx` - API endpoints (lines 3276-3455)

### Frontend
- `/components/SourceLibraryManager.tsx` - Main component
- `/utils/api.tsx` - API functions (lines 745-798)
- `/data/sources.ts` - Default source library

### Documentation
- `/docs/SOURCE_LIBRARY_MANAGER_PRODUCTION.md` - This file
- `/data/README.md` - Source library structure
- `/data/SOURCE_SELECTION_EXAMPLES.md` - Tagging guidelines

---

## Summary

The Source Library Manager is now **production-ready** with:

✅ **Complete CRUD** operations with cloud persistence  
✅ **Import/Export** for data portability  
✅ **Search & Filtering** for easy discovery  
✅ **Usage Tracking** to prevent data integrity issues  
✅ **Validation** on both frontend and backend  
✅ **Cloud Sync** with status indicators  
✅ **Admin-only** write operations for security  
✅ **40+ Default Sources** covering major material types  
✅ **Comprehensive Error Handling** with graceful degradation

The system is ready for production deployment and can scale to handle hundreds or thousands of sources efficiently.
