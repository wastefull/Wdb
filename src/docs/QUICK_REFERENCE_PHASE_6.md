# Quick Reference: Phase 6 Components

## Components Created

### 1. UserProfileView
**File:** `/components/UserProfileView.tsx`

**Props:**
```typescript
{
  userId: string;
  onBack: () => void;
  isOwnProfile: boolean;
}
```

**Features:**
- View/edit profile (avatar, bio, social link)
- Display role badge (Admin)
- Member since date
- Contribution history placeholder
- Save/cancel actions

**Usage:**
```tsx
<UserProfileView 
  userId={currentUser.id}
  onBack={() => setView('home')}
  isOwnProfile={true}
/>
```

---

### 2. NotificationBell
**File:** `/components/NotificationBell.tsx`

**Props:**
```typescript
{
  userId: string;
  isAdmin: boolean;
}
```

**Features:**
- Badge with unread count (9+ max)
- Auto-polling every 30 seconds
- Popover with scrollable list
- Mark individual/all as read
- Type-specific emoji icons
- Time-ago formatting
- Admin aggregation (user + admin notifications)

**Usage:**
```tsx
<NotificationBell 
  userId={currentUser.id}
  isAdmin={currentUser.role === 'admin'}
/>
```

**Notification Types:**
- `submission_approved` - ✅
- `feedback_received` - 💬
- `new_review_item` - 📝
- `article_published` - 🎉
- `content_flagged` - ⚠️

---

### 3. ArticleEditor
**File:** `/components/ArticleEditor.tsx`

**Props:**
```typescript
{
  article?: Article; // For editing existing
  materials: Material[]; // For picker
  onSave: (article: Article) => Promise<void>;
  onCancel: () => void;
}
```

**Features:**
- Title input with auto-slug generation
- Slug input (URL path)
- Category selector (composting/recycling/reuse)
- Material picker dropdown
- Markdown toolbar (Bold, Italic, Heading, Link, List)
- Edit/Preview tabs
- ReactMarkdown rendering
- Form validation

**Usage:**
```tsx
<ArticleEditor
  materials={allMaterials}
  onSave={async (article) => {
    await api.createArticle(article);
    toast.success('Article created!');
  }}
  onCancel={() => setView('list')}
/>
```

---

## API Functions (Phase 6)

### User Profiles
```typescript
getUserProfile(userId: string): Promise<Profile>
updateUserProfile(userId: string, updates: {
  bio?: string;
  social_link?: string;
  avatar_url?: string;
}): Promise<Profile>
```

### Articles
```typescript
getArticles(params?: {
  status?: string;
  material_id?: string;
}): Promise<Article[]>

getArticle(id: string): Promise<Article>

createArticle(article: {
  title: string;
  slug: string;
  content_markdown: string;
  category: 'composting' | 'recycling' | 'reuse';
  material_id: string;
}): Promise<Article>

updateArticle(id: string, updates: any): Promise<Article>

deleteArticle(id: string): Promise<void>
```

### Submissions
```typescript
getSubmissions(status?: string): Promise<Submission[]>
getMySubmissions(): Promise<Submission[]>

createSubmission(submission: {
  type: 'new_material' | 'edit_material' | 'new_article' | 'update_article' | 'delete_material' | 'delete_article';
  content_data: any;
  original_content_id?: string;
}): Promise<Submission>

updateSubmission(id: string, updates: {
  status?: string;
  feedback?: string;
  reviewed_by?: string;
}): Promise<Submission>

deleteSubmission(id: string): Promise<void>
```

### Notifications
```typescript
getNotifications(userId: string): Promise<Notification[]>
markNotificationAsRead(id: string): Promise<Notification>
markAllNotificationsAsRead(userId: string): Promise<void>
```

---

## Backend Routes

### User Profiles
- `GET /profile/:userId` - Get profile
- `PUT /profile/:userId` - Update profile (own only)

### Articles
- `GET /articles?status=published&material_id=abc` - List with filters
- `GET /articles/:id` - Get single article
- `POST /articles` - Create (authenticated)
- `PUT /articles/:id` - Update (author or admin)
- `DELETE /articles/:id` - Delete (author or admin)

### Submissions
- `GET /submissions?status=pending_review` - List all (admin)
- `GET /submissions/my` - User's own submissions
- `POST /submissions` - Create submission
- `PUT /submissions/:id` - Update status (admin)
- `DELETE /submissions/:id` - Delete (admin)

### Notifications
- `GET /notifications/:userId` - Get notifications
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/:userId/read-all` - Mark all as read

---

## Data Types

### Article
```typescript
{
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
```

### Submission
```typescript
{
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
```

### Notification
```typescript
{
  id: string;
  user_id: string;
  type: 'submission_approved' | 'feedback_received' | 'new_review_item' | 'article_published' | 'content_flagged';
  content_id: string;
  content_type: 'material' | 'article' | 'submission';
  message: string;
  read: boolean;
  created_at: string;
}
```

### UserProfile
```typescript
{
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

---

## Integration Checklist (Phase 6.2)

- [ ] Add NotificationBell to main app header
- [ ] Add profile link to user menu
- [ ] Create "Write Article" button for authenticated users
- [ ] Display articles on material detail pages
- [ ] Implement material-article deletion cascade
- [ ] Create MaterialSubmissionForm component
- [ ] Create MaterialEditSuggestionForm component
- [ ] Create ArticleSubmissionView wrapper
- [ ] Add navigation to UserProfileView
- [ ] Test end-to-end submission workflow

---

## Styling Notes

All components use:
- `font-['Sniglet:Regular',_sans-serif]` for text
- Sokpop-inspired colors (pastel backgrounds)
- Border style: `border-[1.5px] border-[#211f1c] dark:border-white/20`
- Hover effect: `hover:shadow-[2px_2px_0px_0px_#000000]`
- Dark mode support with `dark:` prefixes

---

## Testing Notes

### Manual Testing Steps

**User Profile:**
1. Navigate to user profile
2. Click "Edit Profile"
3. Add bio, social link, avatar URL
4. Save and verify changes persist
5. Test as different user (should be view-only)

**Notifications:**
1. Create submission as user
2. Check admin notification appears
3. Mark as read
4. Verify badge count updates
5. Test "Mark all read" functionality

**Article Editor:**
1. Click "New Article"
2. Enter title (watch auto-slug)
3. Select category and material
4. Use markdown toolbar
5. Preview in Preview tab
6. Save and verify storage

---

## Common Issues

**Notifications not appearing:**
- Check userId matches current user
- Verify polling is running (30s interval)
- Check backend returns notifications

**Profile updates not saving:**
- Ensure userId matches authenticated user
- Check API returns updated profile
- Verify localStorage sync

**Article preview not rendering:**
- Check ReactMarkdown is imported
- Verify markdown syntax is valid
- Look for console errors

---

## Next Steps (Phase 6.2)

1. **Create submission forms** using ArticleEditor
2. **Integrate NotificationBell** into App.tsx header
3. **Add profile navigation** to user menu
4. **Display articles** on material detail pages
5. **Test workflows** end-to-end
