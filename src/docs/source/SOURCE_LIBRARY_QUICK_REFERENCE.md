# Source Library Manager - Quick Reference Card

**One-page reference for using the Source Library Manager**

---

## Quick Start

1. Navigate to **Source Library** from main menu
2. Admin login required for edit operations
3. Export button available to all users

---

## 🔑 Key Features

| Feature           | Admin Required | Description                           |
| ----------------- | -------------- | ------------------------------------- |
| **View Sources**  | ❌ No          | Browse all sources in table           |
| **Search**        | ❌ No          | Real-time search by title/author/tags |
| **Filter**        | ❌ No          | Filter by type and tags               |
| **Export**        | ❌ No          | Download sources as JSON              |
| **Import**        | ✅ Yes         | Upload sources from JSON              |
| **Add Source**    | ✅ Yes         | Create new source                     |
| **Edit Source**   | ✅ Yes         | Modify existing source                |
| **Delete Source** | ✅ Yes         | Remove unused source                  |
| **Cloud Sync**    | ✅ Yes         | Sync to Supabase backend              |

---

## 📝 Adding a Source

### Required Fields

- **Title** - Source title
- **Type** - One of 5 types (see below)

### Optional Fields

- **Authors** - "Last, F., Last, F., et al."
- **Year** - Publication year (1900-2026)
- **DOI** - Digital Object Identifier
- **URL** - Link to source
- **Weight** - Custom confidence (0-1)
- **Abstract** - Brief summary
- **Tags** - Comma-separated (e.g., "plastic, recycling")

### Example

```
Title: Recycling Rates in California
Type: Government
Authors: California EPA
Year: 2024
DOI: 10.1234/caepa.2024
Tags: recycling, california, government
Weight: 0.9
```

---

## Source Types & Weights

| Type              | Default Weight | Description                     |
| ----------------- | -------------- | ------------------------------- |
| **Peer-Reviewed** | 1.0            | Academic journal articles       |
| **Government**    | 0.9            | EPA, EU, national agencies      |
| **Industrial**    | 0.7            | LCA databases, industry reports |
| **NGO/Nonprofit** | 0.6            | Research organizations          |
| **Internal**      | 0.3            | Unpublished, proprietary        |

---

## Search & Filter

### Search Box

- Searches: Title, Authors, Tags
- Real-time results
- Case-insensitive

### Type Filter

- Dropdown with 5 source types
- Select "All Types" to clear

### Tag Filter

- Click tags to select (blue = selected)
- Multi-select enabled (AND logic)
- Shows all available tags

### Clear Filters

- Appears when filters are active
- Resets all filters at once

---

## 📤 Import / Export

### Export

1. Click **Export** button
2. JSON file downloads
3. Filename: `wastedb-sources-YYYY-MM-DD.json`

### Import (Admin Only)

1. Click **Import** button
2. Select JSON file
3. System validates data
4. Duplicates skipped
5. Click **Sync to Cloud** to save

**JSON Format:**

```json
[
  {
    "id": "unique-id",
    "title": "Source Title",
    "type": "peer-reviewed",
    "authors": "Smith, J.",
    "year": 2024,
    "tags": ["tag1", "tag2"]
  }
]
```

---

## ☁️ Cloud Sync

### Auto-Sync (Admin)

- ✅ Add source → Auto-syncs
- ✅ Edit source → Auto-syncs
- ✅ Delete source → Auto-syncs
- **Indicator:** Green cloud icon

### Manual Sync (Admin)

- After import operations
- **Indicator:** Orange cloud icon
- Click **Sync to Cloud** button
- Saves all local changes

### Refresh from Cloud (Admin)

- Click **Refresh** button
- Reloads from cloud
- **Warning:** Discards unsaved local changes

---

## 🛡️ Data Protection

### Duplicate Detection

- ✅ Prevents duplicate DOI
- ✅ Prevents duplicate title
- Error message shows existing source

### Usage Tracking

- Shows materials using each source
- **Cannot delete** sources in use
- Badge shows usage count

### Validation

- ✅ Required fields enforced
- ✅ Year range: 1900 - current+1
- ✅ Weight range: 0.0 - 1.0
- ✅ Valid source type only

---

## 🎨 UI Elements

### Table Columns

1. **Source** - Title, authors, year, DOI link
2. **Type** - Color-coded badge
3. **Weight** - Confidence value (0-1)
4. **Tags** - First 3 + count
5. **Usage** - Materials using this source
6. **Actions** - Edit ✏️ / Delete 🗑️ buttons

### Status Indicators

- 🟢 **Green Cloud** - Synced with cloud
- 🟠 **Orange Cloud** - Local only
- **Book Icon** - No sources found

### Color Coding

- 🟢 **Green** - Peer-Reviewed
- 🔵 **Blue** - Government
- 🟡 **Yellow** - Industrial
- 🟣 **Purple** - NGO/Nonprofit
- ⚫ **Gray** - Internal

---

## ⚠️ Common Errors

| Error                                  | Cause                | Solution                             |
| -------------------------------------- | -------------------- | ------------------------------------ |
| "Title is required"                    | Empty title field    | Enter title                          |
| "Source type is required"              | No type selected     | Select type                          |
| "Duplicate DOI"                        | DOI already exists   | Use different DOI or edit existing   |
| "Duplicate title"                      | Title already exists | Use different title or edit existing |
| "Weight must be between 0 and 1"       | Invalid weight       | Enter value 0.0-1.0                  |
| "Please enter a valid year"            | Year out of range    | Use 1900-2026                        |
| "Cannot delete: Used by X material(s)" | Source in use        | Remove from materials first          |
| "Admin access required"                | Not admin user       | Sign in as admin                     |

---

## 📋 Keyboard Shortcuts

| Shortcut       | Action               |
| -------------- | -------------------- |
| `Ctrl/Cmd + F` | Focus search box     |
| `Tab`          | Navigate form fields |
| `Enter`        | Submit form          |
| `Esc`          | Close dialog         |

---

## 🔧 Troubleshooting

### Sources not loading?

1. Check internet connection
2. Refresh page
3. Clear browser cache
4. Check console for errors

### Sync not working?

1. Verify admin access
2. Check cloud indicator
3. Try manual sync
4. Refresh from cloud

### Import failed?

1. Validate JSON format
2. Check required fields
3. Review error message
4. Try smaller batch

### Search not working?

1. Clear filters first
2. Check spelling
3. Try partial matches
4. Refresh page

---

## Usage Statistics

View in table:

- **Usage** column shows count
- Click count to see materials (future)
- Empty = "Unused"

Protection:

- Cannot delete sources with usage > 0
- Must remove from materials first

---

## Best Practices

### Adding Sources

1. ✅ Search for duplicates first
2. ✅ Use DOI when available
3. ✅ Add relevant tags
4. ✅ Include year and authors
5. ✅ Add abstract for context

### Organizing Sources

1. ✅ Use consistent tag naming
2. ✅ Tag by material type
3. ✅ Tag by process
4. ✅ Tag by parameter
5. ✅ Export backups regularly

### Data Quality

1. ✅ Verify DOI links work
2. ✅ Use correct source type
3. ✅ Keep abstracts concise
4. ✅ Update outdated sources
5. ✅ Remove duplicate entries

---

## 📞 Support

### Documentation

- **Full Guide:** `/docs/SOURCE_LIBRARY_MANAGER_PRODUCTION.md`
- **Testing:** `/docs/SOURCE_LIBRARY_TESTING_GUIDE.md`
- **API Docs:** Built into app (Code icon)

### Contact

- **Email:** natto@wastefull.org
- **Organization:** Wastefull
- **Location:** San Jose, California

---

## 🔗 Quick Links

| Link                                                             | Description                     |
| ---------------------------------------------------------------- | ------------------------------- |
| [Main Documentation](/docs/SOURCE_LIBRARY_MANAGER_PRODUCTION.md) | Complete feature documentation  |
| [Testing Guide](/docs/SOURCE_LIBRARY_TESTING_GUIDE.md)           | Step-by-step testing procedures |
| [Project Roadmap](/ROADMAP.md)                                   | Overall project status          |
| [Phase 5 Docs](/docs/PHASE_5_COMPLETE.md)                        | Scientific data infrastructure  |

---

**Last Updated:** November 2, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
