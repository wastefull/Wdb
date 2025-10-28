# Phase 6 Content Management - Quick Reference

**Status:** 75% Complete (3 of 4 sub-phases done)  
**Last Updated:** October 28, 2025

---

## Overview

Phase 6 implements a complete editorial workflow for community-driven content with admin oversight.

### Completed Sub-Phases ✅

- **6.1 Foundation** - User profiles, notifications, backend
- **6.2 Submission Forms** - User submission UI
- **6.3 Review Center** - Admin review & approval

### Remaining Sub-Phase

- **6.4 Editorial Features** - Dual attribution, diff viewer, emails

---

## User Workflows

### For Regular Users (Non-Admin)

#### Submit a New Material
1. Click green "Submit Material" button
2. Fill in: Name, Category, Description (optional)
3. Click "Submit for Review"
4. Check "My Submissions" to track status

#### Suggest an Edit
1. Browse materials
2. Click pencil icon on any material card
3. Make changes + provide reason
4. Submit suggestion
5. Track in "My Submissions"

#### Submit an Article
1. Access article submission form (programmatic)
2. Choose Category + Material
3. Write content in Markdown
4. Submit for review
5. Track in "My Submissions"

#### Check Submission Status
1. Click "My Submissions" button
2. View status badges:
   - 🟡 **Pending Review** - Waiting for admin
   - 🟢 **Approved** - Published!
   - 🔴 **Rejected** - See feedback
   - 🟡 **Needs Revision** - Make changes

---

## Admin Workflows

### Accessing Admin Tools

1. Click "Admin" toggle (top bar)
2. Admin buttons appear:
   - **Review Center** (green) - Review submissions
   - **Database Management** (yellow)
   - **User Management** (red)
   - **Whitepaper Sync** (blue)

### Review Submissions

#### Quick Review (Approve/Flag)

**From Review Tab:**
1. Open Review Center
2. Click "Review" on submission
3. Read content
4. Click "Approve" → Confirm
   - OR click "Flag" → Enter reason

#### Detailed Review (Edit/Suggest/Reject)

**From Review Modal:**
1. Open submission for review
2. Choose action:
   - **Approve** - Publish as-is
   - **Edit Directly** - Modify and publish
   - **Suggest Edits** - Request changes
   - **Reject** - Decline with feedback
3. Complete form if needed
4. Click "Confirm"

### Using the Three Tabs

**Review Tab (Green)**
- New submissions awaiting first review
- Actions: Review, Flag
- Primary workflow starts here

**Pending Tab (Yellow)**
- Items needing revision
- Approved items awaiting processing
- Actions: View Details

**Moderation Tab (Red)**
- Flagged submissions
- Rejected submissions  
- Actions: Review Moderation

---

## Component Reference

### User-Facing Components

| Component | Location | Purpose |
|-----------|----------|---------|
| SubmitMaterialForm | `/components/SubmitMaterialForm.tsx` | New material submission |
| SuggestMaterialEditForm | `/components/SuggestMaterialEditForm.tsx` | Material edit suggestions |
| SubmitArticleForm | `/components/SubmitArticleForm.tsx` | Article submissions |
| MySubmissionsView | `/components/MySubmissionsView.tsx` | User submission dashboard |

### Admin-Facing Components

| Component | Location | Purpose |
|-----------|----------|---------|
| ContentReviewCenter | `/components/ContentReviewCenter.tsx` | Main review interface |
| ReviewModal | `/components/ReviewModal.tsx` | Detailed review actions |
| UserManagementView | `/components/UserManagementView.tsx` | User admin |
| NotificationBell | `/components/NotificationBell.tsx` | Activity alerts |

---

## API Endpoints

### Submissions

```typescript
// Get all submissions (admin only)
GET /submissions
GET /submissions?status=pending_review

// Get user's own submissions
GET /submissions/my

// Create submission
POST /submissions
Body: {
  type: 'new_material' | 'edit_material' | 'new_article',
  content_data: { /* submission fields */ },
  original_content_id?: string
}

// Update submission (admin only)
PUT /submissions/:id
Body: {
  status?: 'approved' | 'rejected' | 'needs_revision' | 'flagged',
  feedback?: string,
  reviewed_by?: string
}

// Delete submission
DELETE /submissions/:id
```

### Materials (Used by Review Flow)

```typescript
// Create material (from approved submission)
POST /materials

// Update material (from approved edit)
PUT /materials/:id
```

---

## Status Flow

```mermaid
pending_review
    ↓
    ├─→ approved ──────────→ Published
    ├─→ needs_revision ───→ User edits ──→ pending_review
    ├─→ rejected ─────────→ Moderation tab
    └─→ flagged ──────────→ Moderation tab
```

---

## Color System

### Status Colors

- 🟢 **Green** (`#c8e5c8`) - Approved, Ready to Review
- 🟡 **Yellow** (`#f4d3a0`) - Pending, Needs Action
- 🔴 **Red** (`#e6beb5`) - Rejected, Flagged, Deleted
- 🔵 **Blue** (`#b8c8cb`) - Edit, Neutral Action

### Tab Colors

- **Review:** Green - Active work needed
- **Pending:** Yellow - Waiting state
- **Moderation:** Red - Problem content

### Button Colors

- **Submit Material:** Green
- **My Submissions:** Yellow/Orange
- **Review Center:** Green
- **Database Management:** Yellow
- **User Management:** Red
- **Whitepaper Sync:** Blue

---

## Common Tasks

### As Admin: Approve a Material Submission

```
1. Click "Review Center"
2. Review tab shows pending items
3. Click "Review" on submission
4. Modal opens with content
5. Click "Approve" action
6. Click "Confirm"
✅ Material published to database
✅ User notified via status change
```

### As Admin: Request Changes

```
1. Open ReviewModal for submission
2. Click "Suggest Edits" action
3. Type feedback in textarea
4. Click "Confirm"
✅ Status → needs_revision
✅ Feedback visible to user
✅ Moves to Pending tab
```

### As Admin: Edit Before Publishing

```
1. Open ReviewModal
2. Click "Edit Directly" action
3. Modify fields as needed
4. Click "Confirm"
✅ Published with your edits
✅ Original submitter still credited (Phase 6.4: dual attribution)
```

### As User: Check Submission Status

```
1. Click "My Submissions"
2. View list of your submissions
3. Check status badge
4. Read feedback if provided
5. Take action if needed
```

---

## Keyboard Shortcuts

*Coming in Phase 6.4*

Planned shortcuts:
- `Cmd/Ctrl + R` - Open Review Center
- `Cmd/Ctrl + N` - New submission
- `Esc` - Close modal
- `Enter` - Confirm action
- `Tab` - Navigate tabs

---

## Troubleshooting

### User Can't Submit

**Problem:** Submit button missing  
**Solution:** User must be logged in

**Problem:** Form won't submit  
**Solution:** Check required fields (name, category)

### Admin Can't Approve

**Problem:** Confirm button disabled  
**Solution:** Wait for processing to complete

**Problem:** Material not appearing  
**Solution:** Check API errors in console

### Status Not Updating

**Problem:** My Submissions shows old status  
**Solution:** Refresh page (auto-refresh coming in Phase 6.5)

**Problem:** Review Center doesn't update  
**Solution:** Action automatically refreshes list

---

## Data Model

### Submission Object

```typescript
interface Submission {
  id: string;
  type: 'new_material' | 'edit_material' | 'new_article';
  content_data: {
    name?: string;           // Materials
    category?: string;       // Materials & Articles
    description?: string;    // Materials
    change_reason?: string;  // Edit suggestions
    title?: string;          // Articles
    content?: string;        // Articles
    material_id?: string;    // Articles
  };
  original_content_id?: string;  // For edits
  status: 'pending_review' | 'approved' | 'rejected' | 
          'needs_revision' | 'flagged';
  feedback?: string;
  submitted_by: string;      // User ID
  reviewed_by?: string;      // Admin ID
  created_at: string;
  updated_at: string;
}
```

---

## Testing Checklist

### User Submission Flow

- [ ] Submit new material
- [ ] Submit with missing required field (validation)
- [ ] Submit material edit suggestion
- [ ] Submit article
- [ ] View My Submissions
- [ ] See status badges
- [ ] Read admin feedback

### Admin Review Flow

- [ ] Access Review Center
- [ ] Switch between tabs
- [ ] Open submission for review
- [ ] Approve submission
- [ ] Edit before approving
- [ ] Suggest revisions
- [ ] Reject submission
- [ ] Flag submission
- [ ] Verify auto-publish

### Integration

- [ ] Approved material appears in database
- [ ] Edited material updates correctly
- [ ] Status updates reflect in My Submissions
- [ ] Notifications created (Phase 6.1)
- [ ] Feedback stored and displayed

---

## Next: Phase 6.4 Editorial Features

**Coming Soon:**

1. **Dual Attribution**
   - Writer credit
   - Editor credit (if modified)
   - Display on published content

2. **Inline Diff Viewer**
   - Visual comparison of edits
   - Color-coded changes
   - Side-by-side view

3. **Article Publishing**
   - Full article management
   - Material associations
   - Markdown rendering

4. **Email Notifications**
   - Status change emails
   - Feedback delivery
   - Branded templates

---

## Resources

### Documentation

- `/docs/PHASE_6.1_FOUNDATION.md`
- `/docs/PHASE_6.2_SUBMISSION_FORMS_COMPLETE.md`
- `/docs/PHASE_6.3_REVIEW_CENTER_COMPLETE.md`
- `/ROADMAP.md`

### Source Code

- `/components/SubmitMaterialForm.tsx`
- `/components/SuggestMaterialEditForm.tsx`
- `/components/SubmitArticleForm.tsx`
- `/components/MySubmissionsView.tsx`
- `/components/ContentReviewCenter.tsx`
- `/components/ReviewModal.tsx`

### Backend

- `/supabase/functions/server/index.tsx` (submission endpoints)
- `/utils/api.tsx` (API client functions)

---

**Phase 6 Progress:** 75% (6.1 ✅ | 6.2 ✅ | 6.3 ✅ | 6.4 ⬜)  
**Overall Project:** 75% (6 of 8 phases complete)
