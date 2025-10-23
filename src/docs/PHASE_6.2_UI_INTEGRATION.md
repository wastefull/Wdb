# Phase 6.2 UI Integration - Progress Update

**Date:** October 23, 2025  
**Status:** In Progress (Step 1 of 3 complete)

## Overview
Phase 6.2 focuses on integrating the Phase 6.1 components (NotificationBell, UserProfileView, ArticleEditor) into the main WasteDB application and creating submission forms for community contributions.

---

## Step 1: UI Integration ✅ COMPLETE

### Components Integrated

**NotificationBell**
- ✅ Added to StatusBar component in main header
- ✅ Positioned between user info and admin toggle
- ✅ Polls for notifications every 30 seconds
- ✅ Displays unread count badge
- ✅ Admin aggregation (user + admin notifications)
- ✅ Styled as subtle, minimal icon (14px bell, no border)
- ✅ Hover opacity transition for feedback

**UserProfileView**
- ✅ Added to currentView state management
- ✅ User info in header now clickable to view profile
- ✅ Navigate to profile: `{ type: 'user-profile', userId }`
- ✅ Supports own profile editing
- ✅ Supports viewing other users' profiles (read-only)
- ✅ Includes back button to return to materials view

### Changes Made

**`/App.tsx`**
1. Added imports for NotificationBell and UserProfileView
2. Updated StatusBar component:
   - Made user info button clickable
   - Added NotificationBell next to user info
   - Changed tooltip text to "View profile"
3. Extended currentView type union to include:
   - `{ type: 'user-profile'; userId: string }`
   - `{ type: 'whitepaper-sync' }` (was missing)
4. Added UserProfileView render logic in main view switcher
5. NotificationBell receives `userId` and `isAdmin` props

**`/components/NotificationBell.tsx`**
- Made bell icon more subtle (14px instead of 18px)
- Removed border and background
- Changed to simple hover opacity effect
- Reduced badge size (3px x 3px with 8px font)
- Changed icon color to `text-black/60` for subtlety

### Design Decisions

**Notification Bell Placement**
- Positioned between user info and admin toggle for logical grouping
- Admin users see aggregated notifications (own + admin queue)
- Maintains visual hierarchy: Profile → Notifications → Admin → Logout

**Profile Navigation**
- User info becomes clickable button with hover effect
- Tooltip changed from showing email to "View profile"
- `isOwnProfile` prop enables edit mode only for current user
- Clean back navigation to materials view

**Visual Integration**
- Bell icon uses muted opacity to avoid visual clutter
- Consistent with WasteDB's Sokpop-inspired minimal aesthetic
- Badge uses existing `#e6beb5` pastel color
- Hover states provide subtle feedback

---

## Step 2: Display Articles on Material Pages ⬜ PLANNED

### Tasks
- [ ] Query articles from backend when viewing material detail
- [ ] Display published articles in collapsible sections by category
- [ ] Add "Write Article" button for authenticated users
- [ ] Link articles to ArticleEditor for editing (author/admin only)
- [ ] Show article metadata (author, publish date, editor credits)

### Implementation Notes
- Articles filtered by `material_id` and `status: 'published'`
- Use existing ArticleCard component style
- Category tabs: Composting | Recycling | Reuse
- Empty state: "No articles yet. Be the first to write one!"

---

## Step 3: Submission Forms ⬜ PLANNED

### Components to Create

**MaterialSubmissionForm**
- Submit new materials with basic fields only
- No scientific parameters (admin-only in Data Processing View)
- Fields: name, category, description, compostability, recyclability, reusability
- Creates submission with `type: 'new_material'`
- Status starts as `pending_review`

**MaterialEditSuggestionForm**
- Suggest edits to existing material description
- Shows current description with inline diff preview
- Only description field editable (other changes require admin)
- Creates submission with `type: 'edit_material'`
- Includes `original_content_id` reference

**ArticleSubmissionView**
- Wrapper around existing ArticleEditor
- Category selector (composting/recycling/reuse)
- Material picker dropdown
- Submit as `status: 'pending_review'`
- Creates submission with `type: 'new_article'`

### Workflow
1. User fills form and submits
2. Backend creates Submission record
3. Backend creates Notification for admin (`type: 'new_review_item'`)
4. User sees "Pending Review" badge on their submission
5. Admin reviews in Phase 6.3 Review Center

---

## Testing Checklist

### NotificationBell
- [x] Bell icon displays in header for authenticated users
- [x] Unread count badge shows correctly
- [x] Popover opens on click
- [x] Notifications load and sort by date
- [x] Mark as read updates state
- [x] Mark all as read works
- [x] Admin sees aggregated notifications
- [x] Polling works (30s interval)

### UserProfileView
- [x] User info button navigates to profile
- [x] Profile page loads user data
- [ ] Edit mode works for own profile
- [ ] Save updates persist to backend
- [ ] View-only mode works for other users
- [ ] Back button returns to materials view
- [ ] Role badge displays for admin

---

## Known Issues
None at this time.

---

## Next Steps (Priority Order)

1. **Display Articles on Material Pages** (high value, simple)
   - Modify MaterialDetailView to fetch and display articles
   - Add "Write Article" button
   - Test article display and navigation

2. **Create MaterialSubmissionForm** (core functionality)
   - Basic material fields only
   - Submission workflow integration
   - "Pending Review" badge display

3. **Create ArticleSubmissionView** (leverage existing ArticleEditor)
   - Wrap ArticleEditor with submission logic
   - Material + category picker
   - Submit to review queue

4. **Create MaterialEditSuggestionForm** (enhancement)
   - Inline diff preview
   - Description-only editing
   - Submission workflow

---

## Files Modified

### Created
- `/docs/PHASE_6.2_UI_INTEGRATION.md` - This file

### Modified
- `/App.tsx` - Added NotificationBell and UserProfileView integration
- `/components/NotificationBell.tsx` - Made bell icon more subtle

---

## Progress Tracking

**Phase 6: Content Management** - 25% complete

```
Phase 6.1: Foundation           ✅ 100%
Phase 6.2: Submission Forms     🔄 33% (UI Integration complete)
  - UI Integration              ✅ 100%
  - Display Articles            ⬜ 0%
  - Submission Forms            ⬜ 0%
Phase 6.3: Review Center        ⬜ 0%
Phase 6.4: Editorial Tools      ⬜ 0%
Phase 6.5: Notifications/Email  ⬜ 0%
```

**Overall Project:** 62.5% → 63.75% complete (incremental progress)

---

## Architecture Notes

**Notification Flow:**
```
User Action → Submission Created → Notification Created → 
Bell Badge Updates → Admin Sees in Queue → Review/Approve → 
User Receives Notification
```

**Profile Navigation Flow:**
```
Header User Button → UserProfileView → Edit (if own) → 
Save → API Update → Toast Confirmation → Profile Refreshes
```

**Component Hierarchy:**
```
App.tsx
├── StatusBar
│   ├── RetroButtons (accessibility controls)
│   ├── User Button (→ UserProfileView)
│   ├── NotificationBell (polling notifications)
│   ├── AdminModeButton (conditional)
│   ├── Logout Button
│   └── Sync Status
└── Main Content Area
    └── UserProfileView (when currentView.type === 'user-profile')
```

---

**Session Duration:** ~15 minutes  
**Next Session:** Display articles on material pages + submission forms
