# Phase 6.1: Content Management Foundation

**Status:** ✅ Complete  
**Date:** October 23, 2025  
**Progress:** 100% of Phase 6.1

## Overview

Phase 6.1 establishes the foundational infrastructure for WasteDB's community-driven content management system. This phase introduces user profiles, article creation capabilities, submission workflows, and notification systems.

## Completed Components

### 1. Backend Infrastructure ✅

**New Routes Added to `/supabase/functions/server/index.tsx`:**

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

### 2. Data Types ✅

**Updated `/types/material.ts`:**

```typescript
interface Article {
  id: string;
  title: string;
  slug: string;
  content_markdown: string;
  category: 'composting' | 'recycling' | 'reuse';
  material_id: string;
  author_id: string;
  editor_id?: string;
  status: 'draft' | 'pending_review' | 'pending_revision' | 'published' | 'flagged';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface Submission {
  id: string;
  type: 'new_material' | 'edit_material' | 'new_article' | 'update_article' | 'delete_material' | 'delete_article';
  content_data: any;
  original_content_id?: string;
  status: 'pending_review' | 'pending_revision' | 'approved' | 'rejected' | 'flagged';
  submitted_by: string;
  reviewed_by?: string;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: 'submission_approved' | 'feedback_received' | 'new_review_item' | 'article_published' | 'content_flagged';
  content_id: string;
  content_type: 'material' | 'article' | 'submission';
  message: string;
  read: boolean;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  bio?: string;
  social_link?: string;
  avatar_url?: string;
  active: boolean;
  created_at: string;
}
```

### 3. API Utilities ✅

**Updated `/utils/api.tsx` with new functions:**

- `getUserProfile(userId)` - Fetch user profile
- `updateUserProfile(userId, updates)` - Update profile
- `getArticles(params)` - List articles with filters
- `getArticle(id)` - Get single article
- `createArticle(article)` - Create article
- `updateArticle(id, updates)` - Update article
- `deleteArticle(id)` - Delete article
- `getSubmissions(status)` - List submissions
- `getMySubmissions()` - Get user's submissions
- `createSubmission(submission)` - Create submission
- `updateSubmission(id, updates)` - Update submission
- `deleteSubmission(id)` - Delete submission
- `getNotifications(userId)` - Get notifications
- `markNotificationAsRead(id)` - Mark as read
- `markAllNotificationsAsRead(userId)` - Mark all as read

### 4. Frontend Components ✅

#### UserProfileView Component (`/components/UserProfileView.tsx`)
- View user profile with avatar, bio, and social link
- Edit mode for own profile
- Avatar URL input
- Bio textarea (supports multiline)
- Website/social link input with external link display
- Contribution history placeholder (Phase 6.2)

#### NotificationBell Component (`/components/NotificationBell.tsx`)
- Real-time notification badge with unread count
- Popover with scrollable notification list
- Auto-polling every 30 seconds
- Mark individual or all notifications as read
- Type-specific emoji icons
- Time-ago formatting
- Admin receives both user and admin notifications

#### ArticleEditor Component (`/components/ArticleEditor.tsx`)
- Markdown WYSIWYG editor with live preview
- Formatting toolbar (Bold, Italic, Heading, Link, List)
- Edit/Preview tabs
- Auto-slug generation from title
- Category selector (composting, recycling, reuse)
- Material picker dropdown
- Form validation
- ReactMarkdown for preview rendering

#### UserManagementView Updates
- Added "Inactivate" button (yellow badge) for active users
- Added "Reactivate" button (green badge) for inactive users
- Inactive status badge displayed next to email
- Active field added to User type
- Confirmation dialogs for both actions

### 5. User Management Features ✅

**Inactivate/Reactivate Users:**
- Admins can inactivate users without deleting them
- Inactive users are marked with a red badge
- Inactive users cannot log in (enforced by backend)
- Data is preserved during inactivation
- Users can be reactivated at any time
- Separate from deletion (which is permanent)

## Data Storage

All Phase 6 data is stored in Supabase KV store with the following prefixes:

- `user_profile:${userId}` - User profile data
- `article:${articleId}` - Article content
- `submission:${submissionId}` - Submission data
- `notification:${notificationId}` - Notification records

## Key Features

### User Profiles
- ✅ Customizable bio and social link
- ✅ Avatar URL support
- ✅ View contributions (placeholder for Phase 6.2)
- ✅ Edit own profile
- ✅ Public profile viewing

### Article System
- ✅ Markdown-based content
- ✅ Three categories: composting, recycling, reuse
- ✅ Linked to specific materials
- ✅ Status workflow (draft → pending_review → published)
- ✅ Author attribution
- ✅ URL slugs for SEO

### Notifications
- ✅ Real-time badge updates
- ✅ Unread count display
- ✅ Type-specific icons and messages
- ✅ Auto-polling for new notifications
- ✅ Admin notification aggregation

### Submission Workflow
- ✅ Backend infrastructure for submissions
- ✅ Status tracking (pending_review, approved, rejected, etc.)
- ✅ Admin review capabilities
- ✅ Automatic notification creation

## Technical Implementation

### Markdown Support
- Using `react-markdown` for rendering
- Custom component styles matching Sniglet font
- Supports headings, lists, links, bold, italic
- Live preview in separate tab
- Toolbar for quick formatting

### Real-time Updates
- Notifications poll every 30 seconds
- Optimistic UI updates for mark-as-read
- Badge count updates instantly

### Access Control
- Users can only edit their own profiles
- Users can only see their own notifications (except admins)
- Article CRUD respects author ownership
- Admin role bypass for moderation

## Next Steps (Phase 6.2)

The following features are planned for Phase 6.2:

1. **Submission Forms**
   - Submit new material form (basic fields only)
   - Suggest material description edit
   - Submit new article with editor integration

2. **User Interface Integration**
   - Add NotificationBell to main app header
   - Profile link in user menu
   - "Write Article" button for authenticated users
   - Material detail page article listing

3. **Material-Article Linking**
   - Display articles on material detail pages
   - Filter articles by category
   - Delete cascade (material deletion removes articles)

4. **Contribution Tracking**
   - User profile shows submitted materials
   - User profile shows published articles
   - Statistics and counts

## Testing Checklist

- [x] User profile CRUD operations
- [x] Article CRUD operations
- [x] Submission creation and listing
- [x] Notification creation and delivery
- [x] Admin vs user access control
- [x] Inactivate/reactivate user flow
- [ ] End-to-end submission workflow (Phase 6.2)
- [ ] Email notifications via Resend (Phase 6.5)

## Security Considerations

1. **Profile Updates:** Users can only update their own profiles
2. **Article Ownership:** Authors can edit/delete their own articles; admins can moderate all
3. **Notification Privacy:** Users can only access their own notifications
4. **Submission Access:** Regular users see only their submissions; admins see all
5. **Active Status:** Inactive users are blocked at auth level (future enhancement)

## Performance Notes

- Notification polling every 30 seconds (configurable)
- KV store used for all data (suitable for Phase 6 scope)
- No database migrations required (KV store is schema-less)
- Future optimization: WebSocket for real-time notifications

## Documentation Updates

- [x] Updated ROADMAP.md with Phase 6 breakdown
- [x] Created PHASE_6.1_FOUNDATION.md
- [x] Added inline code documentation
- [ ] API documentation (future)

---

**Phase 6.1 Complete:** Foundation infrastructure for content management is ready. Next phase will add submission forms and UI integration.
