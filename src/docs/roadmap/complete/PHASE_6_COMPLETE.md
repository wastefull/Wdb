# Phase 6: Content Management System - Complete

**Status:** ✅ Complete  
**Started:** October 23, 2025  
**Completed:** November 2, 2025  
**Progress:** 100% (All 5 sub-phases complete)

---

## Overview

Phase 6 implements a comprehensive community-driven content management system that enables users to submit materials and articles while maintaining admin editorial control. The system includes user profiles, submission workflows, admin review tools, email notifications, and dual writer/editor attribution.

**Key Achievement:** Complete editorial workflow from user submission through admin review to publication, with professional email notifications at every step.

---

## Table of Contents

1. [Phase 6.1: Foundation](#phase-61-foundation)
2. [Phase 6.2: Submission Forms & UI Integration](#phase-62-submission-forms--ui-integration)
3. [Phase 6.3: Content Review Center](#phase-63-content-review-center)
4. [Phase 6.4: Editorial Features](#phase-64-editorial-features)
5. [Phase 6.5: Notifications & Email](#phase-65-notifications--email)
6. [User Workflows](#user-workflows)
7. [Admin Workflows](#admin-workflows)
8. [API Reference](#api-reference)
9. [Component Reference](#component-reference)
10. [Testing & Troubleshooting](#testing--troubleshooting)

---

## Phase 6.1: Foundation

**Completed:** October 23, 2025  
**Status:** ✅ 100%

### Summary

Established foundational infrastructure for community-driven content management including user profiles, article creation capabilities, submission workflows, and notification systems.

### Backend Infrastructure

**New Routes** (`/supabase/functions/server/index.tsx`):

#### User Profiles

- `GET /profile/:userId` - Fetch user profile
- `PUT /profile/:userId` - Update user profile (bio, social_link, avatar_url)

#### Articles

- `GET /articles` - List all articles (filterable by status, material_id)
- `GET /articles/:id` - Get single article
- `POST /articles` - Create new article (authenticated users)
- `PUT /articles/:id` - Update article (author or admin)
- `DELETE /articles/:id` - Delete article (author or admin)

#### Submissions

- `GET /submissions` - Get all submissions (admin only)
- `GET /submissions/my` - Get user's own submissions
- `POST /submissions` - Create submission (authenticated users)
- `PUT /submissions/:id` - Update submission status (admin only)
- `DELETE /submissions/:id` - Delete submission (admin only)

#### Notifications

- `GET /notifications/:userId` - Get user notifications
- `PUT /notifications/:id/read` - Mark notification as read
- `PUT /notifications/:userId/read-all` - Mark all notifications as read

### Data Types

Extended `/types/material.ts` with:

```typescript
interface Article {
  id: string;
  title: string;
  slug: string;
  content_markdown: string;
  category: "composting" | "recycling" | "reuse";
  material_id: string;
  author_id: string;
  editor_id?: string;
  status:
    | "draft"
    | "pending_review"
    | "pending_revision"
    | "published"
    | "flagged";
  created_at: string;
  updated_at: string;
  published_at?: string;
  // Phase 6.4 additions:
  created_by?: string;
  edited_by?: string;
  writer_name?: string;
  editor_name?: string;
}

interface Submission {
  id: string;
  type:
    | "new_material"
    | "edit_material"
    | "new_article"
    | "update_article"
    | "delete_material"
    | "delete_article";
  content_data: any;
  original_content_id?: string;
  status:
    | "pending_review"
    | "pending_revision"
    | "approved"
    | "rejected"
    | "flagged";
  submitted_by: string;
  reviewed_by?: string;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type:
    | "submission_approved"
    | "feedback_received"
    | "new_review_item"
    | "article_published"
    | "content_flagged";
  content_id: string;
  content_type: "material" | "article" | "submission";
  message: string;
  read: boolean;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  bio?: string;
  social_link?: string;
  avatar_url?: string;
  active: boolean;
  created_at: string;
}
```

### Frontend Components

#### UserProfileView (`/components/UserProfileView.tsx`)

- View user profile with avatar, bio, and social link
- Edit mode for own profile
- Avatar URL input
- Bio textarea (supports multiline)
- Website/social link input with external link display
- Contribution history placeholder

#### NotificationBell (`/components/NotificationBell.tsx`)

- Real-time notification badge with unread count
- Popover with scrollable notification list
- Auto-polling every 30 seconds
- Mark individual or all notifications as read
- Type-specific emoji icons (✅ 💬 📝 🎉 ⚠️)
- Time-ago formatting
- Admin receives both user and admin notifications

#### ArticleEditor (`/components/ArticleEditor.tsx`)

- Markdown WYSIWYG editor with live preview
- Formatting toolbar (Bold, Italic, Heading, Link, List)
- Edit/Preview tabs
- Auto-slug generation from title
- Category selector (composting, recycling, reuse)
- Material picker dropdown
- Form validation
- ReactMarkdown for preview rendering

#### UserManagementView Updates

- Added \"Inactivate\" button (yellow) for active users
- Added \"Reactivate\" button (green) for inactive users
- Inactive status badge displayed next to email
- Active field added to User type
- Confirmation dialogs for both actions

### Data Storage

All Phase 6 data stored in Supabase KV store with prefixes:

- `user_profile:${userId}`
- `article:${articleId}`
- `submission:${submissionId}`
- `notification:${notificationId}`

---

## Phase 6.2: Submission Forms & UI Integration

**Completed:** October 27, 2025  
**Status:** ✅ 100%

### Summary

Introduces comprehensive user submission system enabling community-driven content creation while maintaining admin editorial control.

### Components Created

#### 1. SubmitMaterialForm (`/components/SubmitMaterialForm.tsx`)

**Purpose:** Allow authenticated users to submit new materials for database inclusion.

**Fields:**

- Material Name (required)
- Category (required) - Dropdown for 8 material categories
- Description (optional)

**Behavior:**

- Creates submission with `type: 'new_material'` and `status: 'pending_review'`
- Sets sustainability scores to 0 (admins add scores later)
- Shows informative note that scores will be added by admins
- Triggers notification to admins
- Redirects users to "My Submissions" for updates

**Integration:**

- Non-admin users see "Submit Material" button (green)
- Admin users see "Add Material" button (blue)
- Form opens as modal overlay

#### 2. SuggestMaterialEditForm (`/components/SuggestMaterialEditForm.tsx`)

**Purpose:** Enable users to propose corrections or improvements to existing material records.

**Fields:**

- Material Name (pre-filled, editable)
- Category (pre-filled, editable dropdown)
- Description (pre-filled, editable)
- Reason for Change (required)

**Features:**

- Shows current material info in highlighted info box
- Validates that changes were actually made
- Requires justification for proposed changes
- Creates `type: 'edit_material'` submission
- Stores `change_reason` in submission metadata

**Integration:**

- "Suggest Edit" button (pencil icon) on material cards for non-admin users
- Button styled with blue background
- Modal opens with pre-populated fields

#### 3. SubmitArticleForm (`/components/SubmitArticleForm.tsx`)

**Purpose:** Allow users to contribute educational content tied to specific materials and sustainability categories.

**Fields:**

- Article Title (required)
- Category (required): Compostability, Recyclability, or Reusability
- Related Material (required): Searchable dropdown
- Article Content (required): Markdown-enabled text area

**Features:**

- Loads all materials for selection
- Shows selected material confirmation
- Large textarea with Markdown hint text
- Uses DaddyTimeMono font for code-friendly editing
- Supports preselected category/material
- Creates `type: 'new_article'` submission

#### 4. MySubmissionsView (`/components/MySubmissionsView.tsx`)

**Purpose:** Dedicated dashboard where users track all submissions and see review status.

**Status Badges:**

- **Pending Review** (yellow) - Awaiting admin review
- **Approved** (green) - Accepted and published
- **Rejected** (red) - Not accepted
- **Needs Revision** (yellow) - Admin feedback provided

**Display Information:**

- Submission type icon (Package, Edit, FileText)
- Submission title/name
- Type label ("New Material", "Material Edit", "New Article")
- Submission timestamp
- Admin feedback (if provided)

**Empty State:**

- Friendly message with icon when no submissions exist
- Encourages users to contribute

**Integration:**

- "My Submissions" button for non-admin users (yellow/orange background)
- Accessible from main materials view

### UI Integration

**NotificationBell Integration:**

- Added to StatusBar component in main header
- Positioned between user info and admin toggle
- Polls for notifications every 30 seconds
- Displays unread count badge
- Subtle styling (14px bell, no border, hover opacity)

**UserProfileView Integration:**

- Added to currentView state management
- User info in header now clickable to view profile
- Navigate to profile: `{ type: 'user-profile', userId }`
- Supports own profile editing
- Supports viewing other users' profiles (read-only)
- Includes back button to return to materials

### User Experience Flow

#### Non-Admin User Journey

1. **Submit a Material**

   - Click "Submit Material" (green button)
   - Fill out basic info (name, category, optional description)
   - Submit for review
   - Receive toast notification
   - Check "My Submissions" to track status

2. **Suggest an Edit**

   - Browse materials as usual
   - Click pencil icon on any material card
   - Review current info and make changes
   - Provide reason for suggested change
   - Submit for review
   - Track in "My Submissions"

3. **Track Submissions**
   - Click "My Submissions" button
   - View all submissions with status badges
   - Read admin feedback if provided
   - Understand next steps

---

## Phase 6.3: Content Review Center

**Completed:** October 28, 2025  
**Status:** ✅ 100%

### Summary

Implements administrative Content Review Center, completing the editorial workflow loop. Admins can review, approve, edit, or reject user submissions through a sophisticated three-tab interface with inline editing capabilities.

### Core Components

#### 1. ContentReviewCenter (`/components/ContentReviewCenter.tsx`)

**Purpose:** Comprehensive admin dashboard for managing all content submissions.

**Three-Tab Interface:**

##### Review Tab (Green)

- Shows all `pending_review` submissions
- Primary action: Review or Flag
- Sorting: Most recent first
- Count badge shows pending items

##### Pending Tab (Yellow)

- Shows `needs_revision` and `approved` items
- Items awaiting submitter action or final processing
- View details available
- Tracks items in limbo
- Actions: View Details, Remit to Review, Delete

##### Moderation Tab (Red)

- Shows `flagged` and `rejected` submissions
- Problematic content requiring attention
- Review moderation action available
- Actions: Review Moderation, Delete
- Audit trail preserved

**Key Features:**

**Submission Cards:**

- Type icon (Package for materials, FileText for articles)
- Submission title/name
- Type label with category
- Content snippet (description or change reason)
- Admin feedback display (if provided)
- Relative timestamps ("5m ago", "2d ago")
- Action buttons contextual to tab

**Auto-Refresh:**

- Reloads after every action
- Ensures up-to-date status
- Smooth transitions between states

**Integration:**

- Accessible via "Review Center" button (green, first in admin row)
- Hooks into existing submission API
- Creates/updates materials automatically on approval

#### 2. ReviewModal (`/components/ReviewModal.tsx`)

**Purpose:** Full-screen modal for detailed submission review with four action paths.

**Action Modes:**

##### 1. Approve (Green)

- One-click approval
- Publishes content as-is
- Auto-creates material or updates existing
- No editing required
- Fast-track for quality submissions
- **Phase 6.4+:** Sends approval email to submitter

##### 2. Edit Directly (Blue)

- Inline editing interface
- Material fields: name, category, description
- Article fields: title, content (Markdown)
- Admin becomes editor (dual attribution)
- Publishes with edits applied
- Preserves original intent while improving quality

##### 3. Suggest Edits (Yellow)

- Sets status to `needs_revision`
- Feedback textarea required
- Sends suggestions back to submitter
- Non-destructive review
- Encourages iteration
- **Phase 6.4+:** Sends branded revision email

##### 4. Reject (Red)

- Sets status to `rejected`
- Feedback textarea required
- Explains rejection reason
- Moves to Moderation tab
- Preserves for audit purposes
- **Phase 6.5+:** Sends professional rejection email

**UI Flow:**

**Initial View:**

- Displays submission content in read-only cards
- Material info: name, category, description, change reason
- Article info: title, category, content preview
- Four action buttons in 2×2 grid
- Clear explanatory text for each action

**Action View:**

- Context-specific interface based on chosen action
- Edit mode: Full form with editable fields
- Suggest/Reject: Large textarea for feedback
- Approve: Confirmation message
- Back button to reconsider
- Confirm button to execute

**Processing:**

- Disables buttons during API calls
- Shows "Processing..." state
- Auto-closes on success
- Refreshes parent list

### Editorial Workflow

#### Status State Machine

```
pending_review
  ↓
  ├─ approved → Published to DB
  ├─ needs_revision → Pending tab → User revises → pending_review
  ├─ rejected → Moderation tab
  └─ flagged → Moderation tab
```

#### User → Admin Flow

1. **User submits** content (Phase 6.2)

   - Status: `pending_review`
   - Appears in Review tab
   - Notification sent to admins

2. **Admin reviews** in Review Center

   - Opens ReviewModal
   - Examines content
   - Chooses action

3. **Admin takes action**

   - **Approve**: Published immediately
   - **Edit**: Modified and published
   - **Suggest**: Returned to user with feedback
   - **Reject**: Archived with reason

4. **User sees result** in My Submissions
   - Status badge updated
   - Feedback displayed
   - Next steps clear

### Auto-Publishing Logic

**New Material:**

```typescript
await api.createMaterial({
  name: materialData.name,
  category: materialData.category,
  description: materialData.description,
  compostability: materialData.compostability || 0,
  recyclability: materialData.recyclability || 0,
  reusability: materialData.reusability || 0,
});
```

**Edit Material:**

```typescript
await api.updateMaterial(original_content_id, {
  name: materialData.name,
  category: materialData.category,
  description: materialData.description,
});
```

---

## Phase 6.4: Editorial Features

**Completed:** October 28, 2025  
**Status:** ✅ 100%

### Summary

Introduces advanced editorial workflow features including email notifications via Resend, dual Writer/Editor credit attribution system, and enhanced review capabilities.

### Deliverables

#### Email Notification System (Resend Integration)

**Backend Implementation** (`/supabase/functions/server/index.tsx`):

##### Generic Email Endpoint

- **POST `/make-server-17cae920/email/send`** - Admin only
  - Accepts: `to`, `subject`, `html`, `text`
  - Uses Resend API with `RESEND_API_KEY`
  - Returns email ID for tracking

##### Revision Request Email

- **POST `/make-server-17cae920/email/revision-request`**
  - Parameters: `submissionId`, `feedback`, `submitterEmail`, `submitterName`, `submissionType`
  - Beautifully formatted HTML email with:
    - WasteDB branding (Fredoka One header, Sniglet body)
    - Retro Wastefull brand design (borders, shadows, color scheme)
    - Reviewer feedback in styled box
    - CTA button to "View My Submissions"
    - Responsive HTML layout
  - Plain text fallback for accessibility
  - From: `WasteDB <no-reply@wastefull.org>`

**Frontend API** (`/utils/api.tsx`):

- `sendEmail()` - Generic email sending wrapper
- `sendRevisionRequestEmail()` - Specialized revision request wrapper

**Integration** (`/components/ContentReviewCenter.tsx`):

- `handleRequestRevision()` updated to:
  1. Update submission status to `needs_revision`
  2. Fetch submitter's profile for email/name
  3. Send formatted revision request email via Resend
  4. Show success toast with email status
  5. Gracefully handle email failures (still updates submission)

**Email Design Features:**

- Matches WasteDB retro aesthetic (yellow `#e4e3ac`, pink `#e6beb5`)
- Responsive layout for mobile and desktop
- ARIA-compliant HTML for screen readers
- Dark mode compatible plain text alternative
- Professional footer with Wastefull organization details

#### Writer/Editor Credit Attribution System

**Data Model Extensions:**

Extended `Material` interface:

```typescript
// Content attribution
created_by?: string;               // User ID of original creator
edited_by?: string;                // User ID of editor (if edited directly by admin)
writer_name?: string;              // Display name of original writer
editor_name?: string;              // Display name of editor
```

Extended `Article` interface:

```typescript
// Content attribution
created_by?: string;               // User ID of original creator
edited_by?: string;                // User ID of editor (if edited directly by admin)
writer_name?: string;              // Display name of original writer
editor_name?: string;              // Display name of editor
```

**Review Workflow Integration:**

**ReviewModal:**

- Updated `onApprove` callback to accept `wasEditedByAdmin` flag
- `handleSubmit()` passes `wasEdited=true` when admin uses "Edit Directly"
- Enables dual credit tracking for admin-edited content

**ContentReviewCenter:**

- `handleApprove()` enhanced with attribution logic:
  1. Fetches submitter profile for writer name
  2. If edited by admin, fetches editor profile
  3. Applies `created_by` and `writer_name` to all approved content
  4. Applies `edited_by` and `editor_name` when `wasEditedByAdmin=true`
  5. Shows dual credit success message: "Written by [Writer], Editor: [Editor]"

**Display Integration** (`/App.tsx`):

```tsx
{
  /* Writer/Editor Attribution */
}
{
  (material.writer_name || material.editor_name) && (
    <div className="mt-1 flex items-center gap-1 flex-wrap font-['Sniglet:Regular',_sans-serif] text-[8px] text-black/40 dark:text-white/40">
      {material.writer_name && material.editor_name ? (
        <>
          <span>by {material.writer_name}</span>
          <span>•</span>
          <span>ed. {material.editor_name}</span>
        </>
      ) : material.writer_name ? (
        <span>by {material.writer_name}</span>
      ) : material.editor_name ? (
        <span>ed. {material.editor_name}</span>
      ) : null}
    </div>
  );
}
```

**Display Rules:**

- **Dual credit:** "by [Writer] • ed. [Editor]" (when both present)
- **Writer only:** "by [Writer]" (original submission, approved as-is)
- **Editor only:** "ed. [Editor]" (edge case, admin-created content)
- Subtle gray text (40% opacity) for unobtrusive credit
- Sniglet font at 8px for consistency
- Dark mode compatible

---

## Phase 6.5: Notifications & Email

**Completed:** November 2, 2025  
**Status:** ✅ 100%

### Summary

Completes the notification and email system by adding approval/rejection email templates, implementing email notifications for all review actions, and adding manual submission management tools.

### Deliverables

#### Approval Email Template

**Backend Implementation:**

- **POST `/make-server-17cae920/email/approval`** - Sends celebratory approval email
  - Parameters: `submitterEmail`, `submitterName`, `submissionType`, `contentName`
  - Features beautiful HTML email with:
    - Green success theme (`#c8e5c8` header)
    - 🎉 celebration emoji
    - "Submission Approved!" headline
    - Content name display (if provided)
    - Success box with checkmark
    - CTA button to "View WasteDB"
    - Encouraging message for future contributions
  - Plain text fallback for accessibility
  - From: `WasteDB <no-reply@wastefull.org>`

**Frontend API:**

- `sendApprovalEmail()` - Wrapper for approval email endpoint

**Integration:**

- `handleApprove()` updated to:
  1. Process and publish the submission
  2. Fetch submitter's profile
  3. Send branded approval email with logo
  4. Create in-app notification for submitter
  5. Show success toast
  6. Gracefully handle email/notification failures

#### Rejection Email Template

**Backend Implementation:**

- **POST `/make-server-17cae920/email/rejection`** - Sends professional rejection notification
  - Parameters: `submitterEmail`, `submitterName`, `submissionType`, `feedback?`
  - Features professional HTML email with:
    - Coral/pink theme (`#e6beb5` header)
    - "Submission Update" headline (diplomatic language)
    - Optional feedback section (if provided by reviewer)
    - Encouraging message about future submissions
    - Professional, respectful tone
  - Plain text fallback for accessibility
  - From: `WasteDB <no-reply@wastefull.org>`

**Frontend API:**

- `sendRejectionEmail()` - Wrapper for rejection email endpoint

**Integration:**

- `handleReject()` updated to:
  1. Update submission status to 'rejected'
  2. Fetch submitter's profile
  3. Send rejection email with feedback and logo
  4. Create in-app notification for submitter
  5. Show success toast
  6. Gracefully handle email/notification failures

#### In-App Notifications System

**Backend Implementation:**

- **POST `/make-server-17cae920/notifications`** - Create notification (admin only)
  - Parameters: `user_id`, `type`, `content_id`, `content_type`, `message`
  - Notification types: `submission_approved`, `feedback_received`, `new_review_item`, `article_published`, `content_flagged`

**UI Component** (NotificationBell):

- Bell icon with unread count badge
- Popover dropdown showing all notifications
- Auto-refresh every 30 seconds
- Type-specific icons (✅ approved, 💬 feedback, 📝 review, 🎉 published, ⚠️ flagged)
- Time ago formatting
- "Mark all read" functionality
- Admin users see both personal and admin notifications

**Notification Triggers:**

- ✅ New submission created → Admin notification
- ✅ Submission approved → Submitter notification
- ✅ Submission rejected → Submitter notification
- ✅ Revision requested → Submitter notification

#### Manual Submission Management

**Backend Implementation:**

- **DELETE `/make-server-17cae920/submissions/:id`** - Delete submission (admin only)

**ContentReviewCenter Actions:**

##### Remit to Review

- **Handler:** `handleRemitToReview()`
- **Functionality:** Moves submission from "Needs Revision" back to "Pending Review"
- **Use Case:** When submitter has made requested changes
- **UI:** Yellow button with Clock icon, only shown for `needs_revision` submissions

##### Delete Submission

- **Handler:** `handleDelete()`
- **Functionality:** Permanently deletes submission from database
- **Safety:** Confirmation dialog ("Are you sure? This cannot be undone")
- **Use Case:** Remove spam, duplicate, or invalid submissions
- **UI:** Pink/coral delete button with XCircle icon in Pending and Moderation tabs

**SubmissionCard Updates:**

- **Pending Tab Actions:**
  - "View Details" button (always shown)
  - "Remit to Review" button (only for `needs_revision` status)
  - "Delete" button (always shown)
- **Moderation Tab Actions:**
  - "Review Moderation" button
  - "Delete" button

### Email Design Features

#### Shared Features (All Emails)

- **WasteDB Logo** displayed at top (120px width)
- Responsive HTML layout for mobile/desktop
- ARIA-compliant for screen readers
- Plain text fallback for compatibility
- Retro Wastefull brand (borders, shadows, colors)
- Sniglet body text
- Wastefull branding in footer
- Dark mode compatible plain text
- Logo URL: `https://bdvfwjmaufjeqmxphmtv.supabase.co/storage/v1/object/public/make-17cae920-assets/uplogo_transparent-1761169051994.png`

#### Approval Email (`#c8e5c8` green theme)

- Celebratory 🎉 emoji at top
- Positive, encouraging language
- "Your contribution is now public" success box
- Invitation to submit more content

#### Rejection Email (`#e6beb5` pink theme)

- Diplomatic "Submission Update" title (not "Rejected")
- Optional feedback section
- Respectful, appreciative tone
- Leaves door open for future contributions

#### Revision Email (`#e4e3ac` yellow theme)

- Professional feedback presentation
- Clear next steps
- Encouraging tone

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

1. Access article submission form
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
3. Read admin feedback
4. Check email for notifications

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
5. Email automatically sent to submitter

### Using the Three Tabs

**Review Tab (Green)**

- New submissions awaiting first review
- Actions: Review, Flag
- Primary workflow starts here

**Pending Tab (Yellow)**

- Items needing revision
- Approved items awaiting processing
- Actions: View Details, Remit to Review, Delete

**Moderation Tab (Red)**

- Flagged submissions
- Rejected submissions
- Actions: Review Moderation, Delete

### Manual Actions

**Remit to Review:**

- Only available for `needs_revision` submissions
- Moves submission back to Review tab
- Use when submitter has made requested changes

**Delete Submission:**

- Available in Pending and Moderation tabs
- Confirmation dialog before deletion
- Permanent action - cannot be undone
- Use for spam, duplicates, or invalid submissions

---

## API Reference

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

// Delete submission (admin only)
DELETE /submissions/:id
```

### User Profiles

```typescript
// Get profile
GET /profile/:userId

// Update profile (own only)
PUT /profile/:userId
Body: {
  bio?: string,
  social_link?: string,
  avatar_url?: string
}
```

### Notifications

```typescript
// Get notifications
GET /notifications/:userId

// Mark as read
PUT /notifications/:id/read

// Mark all as read
PUT /notifications/:userId/read-all

// Create notification (admin only)
POST /notifications
Body: {
  user_id: string,
  type: string,
  content_id: string,
  content_type: string,
  message: string
}
```

### Email

```typescript
// Send generic email (admin only)
POST /email/send
Body: {
  to: string,
  subject: string,
  html: string,
  text: string
}

// Send revision request email
POST /email/revision-request
Body: {
  submissionId: string,
  feedback: string,
  submitterEmail: string,
  submitterName: string,
  submissionType: string
}

// Send approval email
POST /email/approval
Body: {
  submitterEmail: string,
  submitterName: string,
  submissionType: string,
  contentName?: string
}

// Send rejection email
POST /email/rejection
Body: {
  submitterEmail: string,
  submitterName: string,
  submissionType: string,
  feedback?: string
}
```

---

## Component Reference

### User-Facing Components

| Component               | Location                                  | Purpose                   |
| ----------------------- | ----------------------------------------- | ------------------------- |
| SubmitMaterialForm      | `/components/SubmitMaterialForm.tsx`      | New material submission   |
| SuggestMaterialEditForm | `/components/SuggestMaterialEditForm.tsx` | Material edit suggestions |
| SubmitArticleForm       | `/components/SubmitArticleForm.tsx`       | Article submissions       |
| MySubmissionsView       | `/components/MySubmissionsView.tsx`       | User submission dashboard |
| UserProfileView         | `/components/UserProfileView.tsx`         | Profile viewing/editing   |
| NotificationBell        | `/components/NotificationBell.tsx`        | Real-time notifications   |

### Admin-Facing Components

| Component           | Location                              | Purpose                 |
| ------------------- | ------------------------------------- | ----------------------- |
| ContentReviewCenter | `/components/ContentReviewCenter.tsx` | Main review interface   |
| ReviewModal         | `/components/ReviewModal.tsx`         | Detailed review actions |
| UserManagementView  | `/components/UserManagementView.tsx`  | User administration     |
| ArticleEditor       | `/components/ArticleEditor.tsx`       | Markdown article editor |

---

## Testing & Troubleshooting

### Testing Checklist

#### User Submission Flow

- [x] Submit new material
- [x] Submit with missing required field (validation)
- [x] Submit material edit suggestion
- [x] Submit article
- [x] View My Submissions
- [x] See status badges
- [x] Read admin feedback
- [x] Receive email notifications

#### Admin Review Flow

- [x] Access Review Center
- [x] Switch between tabs
- [x] Open submission for review
- [x] Approve submission
- [x] Edit before approving
- [x] Suggest revisions
- [x] Reject submission
- [x] Flag submission
- [x] Verify auto-publish
- [x] Remit to Review
- [x] Delete submission

#### Email System

- [x] Approval email endpoint responds
- [x] Approval emails formatted properly
- [x] Rejection email endpoint responds
- [x] Rejection emails formatted properly
- [x] Revision email sends successfully
- [x] Email failures don't block operations
- [x] WasteDB logo displays in emails
- [ ] Resend domain verified for `no-reply@wastefull.org` (user action required)

#### Integration

- [x] Approved material appears in database
- [x] Edited material updates correctly
- [x] Status updates reflect in My Submissions
- [x] Notifications created properly
- [x] Feedback stored and displayed
- [x] Writer/Editor credits display correctly

### Troubleshooting

#### User Can't Submit

**Problem:** Submit button missing  
**Solution:** User must be logged in

**Problem:** Form won't submit  
**Solution:** Check required fields (name, category)

#### Admin Can't Approve

**Problem:** Confirm button disabled  
**Solution:** Wait for processing to complete

**Problem:** Material not appearing  
**Solution:** Check API errors in console

#### Status Not Updating

**Problem:** My Submissions shows old status  
**Solution:** Refresh page (auto-refresh implemented)

**Problem:** Review Center doesn't update  
**Solution:** Action automatically refreshes list

#### Email Issues

**Problem:** Emails not sending  
**Solution:**

- Check `RESEND_API_KEY` environment variable
- Verify domain in Resend dashboard
- Check browser console for errors
- Review submission still updates even if email fails

**Problem:** Emails going to spam  
**Solution:** Complete Resend domain verification with DNS records

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

## Environment Requirements

### Resend API Key

- **Variable:** `RESEND_API_KEY`
- **Status:** ✅ Configured
- **Usage:** All email sending (revision, approval, rejection)
- **Sender:** `no-reply@wastefull.org` (must be verified in Resend)

### Domain Verification (User Action Required)

1. Log in to Resend dashboard
2. Verify `wastefull.org` domain
3. Add DNS records as instructed
4. Test emails from `no-reply@wastefull.org`
5. Confirm delivery to Gmail, Outlook, etc.

---

## Files Created

### Components

- `/components/UserProfileView.tsx` - User profile viewing/editing
- `/components/NotificationBell.tsx` - Real-time notifications
- `/components/ArticleEditor.tsx` - Markdown article editor
- `/components/SubmitMaterialForm.tsx` - New material submission
- `/components/SuggestMaterialEditForm.tsx` - Material edit suggestions
- `/components/SubmitArticleForm.tsx` - Article submission
- `/components/MySubmissionsView.tsx` - User submission dashboard
- `/components/ContentReviewCenter.tsx` - Admin review interface
- `/components/ReviewModal.tsx` - Detailed review actions

### Modified Files

- `/App.tsx` - Integrated all Phase 6 components
- `/types/material.ts` - Added Article, Submission, Notification, UserProfile types
- `/utils/api.tsx` - Added all Phase 6 API functions
- `/supabase/functions/server/index.tsx` - Added all Phase 6 backend routes

---

## Summary

Phase 6 successfully implements:

- ✅ Complete user submission system (materials, edits, articles)
- ✅ Comprehensive admin review workflow (approve, edit, suggest, reject)
- ✅ Professional email notifications (approval, rejection, revision)
- ✅ Dual Writer/Editor credit attribution system
- ✅ Real-time notification system with bell icon
- ✅ User profile management with bio and social links
- ✅ Manual submission management (remit, delete)
- ✅ Three-tab organization (Review, Pending, Moderation)
- ✅ Graceful error handling for email failures
- ✅ Branded, accessible, responsive email templates

**Overall Progress:** 100% (All 5 sub-phases complete)

The editorial workflow now provides a complete content contribution experience with professional email communications and transparent contributor attribution, enhancing both the admin review process and public recognition of community contributions.

With Phase 6 complete, WasteDB has a production-ready community content management system that empowers users while maintaining editorial quality through admin oversight.

---

**Status:** ✅ Production Ready  
**Next Phase:** Phase 7 (Research API & Data Publication) - Already Complete  
**Current Focus:** Phase 8 (Performance & Scalability)
