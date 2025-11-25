# Source Library Manager - Testing Guide

**Quick Reference for Testing Source Library Manager Production Readiness**

---

## Prerequisites

- ✅ Admin account (natto@wastefull.org or another admin)
- ✅ Backend server running
- ✅ WasteDB application loaded

---

## Test Checklist

### 1. Access & Permissions ✅

**Test as Non-Admin:**

- [ ] Navigate to Source Library
- [ ] Verify "Add Source" button is disabled
- [ ] Verify Import button is not visible
- [ ] Verify Export button IS visible (read-only)
- [ ] Verify blue alert shows "Admin access required"

**Test as Admin:**

- [ ] Sign in as admin
- [ ] Navigate to Source Library
- [ ] Verify all buttons are enabled
- [ ] Verify green/orange cloud sync indicator visible

---

### 2. Load Sources from Cloud ✅

- [ ] On component mount, sources load from cloud
- [ ] Loading spinner shows briefly
- [ ] Green cloud icon shows if sources exist in cloud
- [ ] Sources populate in table

---

### 3. View & Browse Sources ✅

**Table Display:**

- [ ] Sources display in table format
- [ ] Columns: Source, Type, Weight, Tags, Usage, Actions
- [ ] Source titles are links (if DOI present)
- [ ] Type badges are color-coded
- [ ] Tags show (first 3 + count if more)
- [ ] Usage shows material count

**Empty State:**

- [ ] If no sources, shows book icon + "No sources found"

---

### 4. Search & Filter ✅

**Search:**

- [ ] Type in search box
- [ ] Results filter in real-time
- [ ] Searches title, authors, tags
- [ ] Case-insensitive

**Type Filter:**

- [ ] Select "Peer-Reviewed"
- [ ] Only peer-reviewed sources shown
- [ ] Select "All Types" to clear

**Tag Filter:**

- [ ] Click on a tag
- [ ] Tag turns blue (selected)
- [ ] Sources with that tag shown
- [ ] Click multiple tags (AND logic)
- [ ] Click again to deselect

**Clear Filters:**

- [ ] Apply some filters
- [ ] "Showing X of Y sources" appears
- [ ] Click "Clear Filters"
- [ ] All filters reset

---

### 5. Add New Source ✅

**Valid Source:**

- [ ] Click "Add Source"
- [ ] Dialog opens
- [ ] Fill in required fields:
  - Title: "Test Source for Recycling"
  - Type: "Peer-Reviewed"
- [ ] Fill optional fields:
  - Authors: "Doe, J., Smith, A."
  - Year: 2024
  - DOI: "10.1234/test.2024"
  - URL: "https://example.com"
  - Weight: 1.0
  - Tags: "test, recycling, validation"
  - Abstract: "Test source for validation"
- [ ] Click "Add Source"
- [ ] Success toast appears
- [ ] Source appears in table
- [ ] Cloud sync indicator shows synced

**Validation Tests:**

- [ ] Try adding without title → Error: "Title is required"
- [ ] Try adding without type → Error: "Source type is required"
- [ ] Try year = 1800 → Error: "Please enter a valid year"
- [ ] Try weight = 1.5 → Error: "Weight must be between 0 and 1"

**Duplicate Detection:**

- [ ] Add a source with DOI "10.1234/duplicate.test"
- [ ] Try adding another with same DOI
- [ ] Error: "Duplicate DOI: ..."
- [ ] Try adding source with same title
- [ ] Error: "Duplicate title: ..."

---

### 6. Edit Source ✅

- [ ] Click edit icon (✏️) on any source
- [ ] Dialog opens with fields pre-filled
- [ ] Modify title, authors, year, etc.
- [ ] Click "Update Source"
- [ ] Success toast appears
- [ ] Changes reflected in table
- [ ] Cloud syncs automatically

---

### 7. Delete Source ✅

**Unused Source:**

- [ ] Find a source not used by any materials
- [ ] Click trash icon (🗑️)
- [ ] Source deleted immediately
- [ ] Success toast appears
- [ ] Source removed from table

**Used Source:**

- [ ] Find a source used by materials
- [ ] Click trash icon
- [ ] Error: "Cannot delete: Used by X material(s)"
- [ ] Source remains in table

---

### 8. Export Sources ✅

- [ ] Click "Export" button
- [ ] File downloads automatically
- [ ] Filename format: `wastedb-sources-YYYY-MM-DD.json`
- [ ] Open file, verify JSON format
- [ ] All sources present with complete data

---

### 9. Import Sources ✅

**Valid Import:**

- [ ] Create a test JSON file:

```json
[
  {
    "id": "import-test-1",
    "title": "Imported Test Source",
    "authors": "Test Author",
    "year": 2024,
    "type": "government",
    "weight": 0.9,
    "tags": ["import", "test"],
    "abstract": "Test import functionality"
  }
]
```

- [ ] Click "Import" button
- [ ] Select the JSON file
- [ ] Success toast: "Imported X new sources"
- [ ] New source appears in table
- [ ] Orange cloud icon (not synced yet)

**Invalid Import:**

- [ ] Try importing non-JSON file → Error: "Invalid JSON format"
- [ ] Try importing JSON with missing required fields
- [ ] Some sources skipped, toast shows count

**Duplicate Handling:**

- [ ] Import a source with ID that already exists
- [ ] Source is skipped (not duplicated)
- [ ] Toast shows number of new sources imported

---

### 10. Cloud Sync ✅

**Auto-Sync (Add/Edit/Delete):**

- [ ] Create a new source
- [ ] Green cloud icon appears
- [ ] Edit a source
- [ ] Remains synced
- [ ] Delete a source
- [ ] Remains synced

**Manual Sync (After Import):**

- [ ] Import sources
- [ ] Orange cloud icon appears
- [ ] Alert shows "Local Only: Click Sync to Cloud"
- [ ] Click "Sync to Cloud" button
- [ ] Success toast: "X sources synced to cloud"
- [ ] Green cloud icon appears

**Refresh from Cloud:**

- [ ] Make local changes (add/edit)
- [ ] Click "Refresh" button
- [ ] Confirm you want to discard local changes
- [ ] Sources reload from cloud
- [ ] Local changes discarded

---

### 11. Usage Tracking ✅

- [ ] Create a new material (or use existing)
- [ ] In scientific editor, add a source reference
- [ ] Go to Source Library
- [ ] Find that source in table
- [ ] "Usage" column shows "1 material"
- [ ] Try to delete the source
- [ ] Error: "Cannot delete: Used by 1 material(s)"

---

### 12. Responsive Design ✅

**Desktop:**

- [ ] All columns visible
- [ ] Button text fully visible
- [ ] Comfortable spacing

**Tablet (768px):**

- [ ] Table scrolls horizontally if needed
- [ ] Buttons maintain spacing
- [ ] Filters stack vertically

**Mobile (375px):**

- [ ] Buttons show icons only or compressed text
- [ ] Table scrolls horizontally
- [ ] Dialog is scrollable
- [ ] Touch-friendly tap targets

---

### 13. Error Handling ✅

**Network Errors:**

- [ ] Disconnect internet
- [ ] Try to add a source
- [ ] Error toast appears
- [ ] Source saved locally
- [ ] Can retry sync later

**Server Errors:**

- [ ] Stop backend server
- [ ] Try to load sources
- [ ] Fallback to default SOURCE_LIBRARY
- [ ] App remains functional

**Validation Errors:**

- [ ] Invalid inputs show specific error messages
- [ ] Form doesn't close on validation error
- [ ] User can correct and retry

---

### 14. Data Integrity ✅

**Check Database:**

```javascript
// In browser console
fetch(
  "https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-17cae920/sources"
)
  .then((r) => r.json())
  .then((d) => console.log(d.sources));
```

- [ ] All created sources present
- [ ] Data structure correct
- [ ] Timestamps present
- [ ] Created_by and updated_by populated

---

### 15. Performance ✅

**Load Time:**

- [ ] Sources load in < 1 second
- [ ] No lag when typing in search
- [ ] Filters apply instantly
- [ ] Table renders smoothly

**With Many Sources (100+):**

- [ ] Import 100+ sources
- [ ] Table still renders quickly
- [ ] Search remains responsive
- [ ] No visual lag

---

## Expected Results Summary

### ✅ All Features Working

- Create, read, update, delete sources
- Cloud sync (auto and manual)
- Import/export JSON
- Search and filter
- Usage tracking
- Duplicate detection
- Validation on all inputs
- Responsive design

### ✅ Security

- Non-admin cannot modify
- Admin can perform all operations
- Audit trail captured

### ✅ User Experience

- Clear error messages
- Success confirmations
- Loading states
- Empty states
- Help text where needed

---

## Bug Reporting Template

If you find a bug, report it with:

```markdown
**Bug:** [Short description]

**Steps to Reproduce:**

1.
2.
3.

**Expected:** [What should happen]

**Actual:** [What actually happened]

**Console Errors:** [Copy any errors from browser console]

**Environment:**

- Browser: [Chrome/Firefox/Safari/etc.]
- User Role: [Admin/Non-Admin]
- Screen Size: [Desktop/Tablet/Mobile]
```

---

## Success Criteria

The Source Library Manager is production-ready when:

- ✅ All 15 test sections pass
- ✅ No console errors during normal usage
- ✅ Data persists correctly to cloud
- ✅ Import/export work flawlessly
- ✅ Validation prevents bad data
- ✅ Usage tracking prevents accidental deletions
- ✅ Responsive on all screen sizes
- ✅ Clear feedback for all user actions

---

## Next Steps After Testing

1. **Production Deployment**

   - Deploy backend changes
   - Verify environment variables
   - Test with production domain

2. **User Training**

   - Create video tutorial
   - Write help documentation
   - Train admin users

3. **Monitoring**

   - Set up error tracking
   - Monitor sync success rates
   - Track source library growth

4. **Optimization**
   - Add DOI auto-lookup (future)
   - Add BibTeX import (future)
   - Implement advanced search (future)
