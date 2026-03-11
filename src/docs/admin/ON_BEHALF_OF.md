# Post On Behalf Of Another User

**Feature Added:** March 11, 2026  
**Available To:** Admin users only

## Overview

The "Post on behalf of" feature allows administrators to create materials and articles attributed to another user. This is useful when:

- An intern or contributor submitted content through the wrong channel (e.g., submitted an article as a material)
- Content needs to be migrated while preserving original authorship
- An admin is helping a user create content

## How It Works

### For Materials

When creating a new material in admin mode:

1. Open the material creation form (click "Add Material" in admin mode)
2. At the bottom of the form, you'll see a **"Post on behalf of"** dropdown
3. Select a user from the list (searchable by name or email)
4. Complete the form and submit

The material will be attributed to the selected user (`created_by` field), but the audit log will still record that **you** (the admin) performed the action.

### For Articles

When adding a new article to a material in admin mode:

1. Navigate to a material's articles section
2. Click "Add Article"
3. Below the content editor, you'll see the **"Post on behalf of"** section
4. Select a user from the dropdown
5. Complete the form and submit

The article's `created_by` and `author_id` fields will be set to the selected user.

## Important Notes

### Audit Trail

The audit log always records:

- The **admin user** who performed the action
- The **target user** (if "on behalf of" was used)
- A timestamp and all relevant details

This ensures full accountability even when attributing content to others.

### Visibility

- The "Post on behalf of" selector only appears when:
  - Admin mode is active
  - Creating **new** content (not editing existing)
- The feature is not available for updates/edits to prevent confusion

### User Validation

The backend validates that the target user exists before allowing the attribution. If you see an error about a non-existent user, verify the user ID is correct.

## Technical Details

### Backend Implementation

The `POST /materials` endpoint accepts an optional `on_behalf_of` field:

```json
{
  "id": "material-123",
  "name": "Example Material",
  "category": "Plastics",
  "on_behalf_of": "user-uuid-here"
}
```

The backend:

1. Validates the target user exists
2. Sets `created_by` to the target user's ID
3. Logs the admin action with `_admin_action.on_behalf_of` metadata
4. Removes `on_behalf_of` from the stored material data

### Frontend Components

**UserSelector** (`src/components/forms/UserSelector.tsx`)

- Reusable dropdown component for selecting users
- Loads users via `api.getAllUsers()`
- Searchable by name or email
- Shows admin badge for admin users

**MaterialForm** (`src/components/forms/MaterialForm.tsx`)

- Accepts `isAdminMode` prop
- Shows UserSelector when in admin mode and creating new materials
- Passes `onBehalfOf` option to save handler

**ArticleForm** (`src/components/forms/ArticleForm.tsx`)

- Accepts `isAdminMode` prop
- Shows UserSelector when in admin mode and creating new articles
- Passes `onBehalfOf` option to save handler

### API

```typescript
// Save material on behalf of another user
api.saveMaterial(material, { onBehalfOf: targetUserId });

// MaterialsContext also accepts the option
addMaterial(materialData, { onBehalfOf: targetUserId });
```

## Example Use Case: Fixing Intern's Submission

Your intern submitted an article about "How to Compost Coffee Grounds" as a material instead of as an article under the Coffee Grounds material.

**Solution:**

1. Ensure the "Coffee Grounds" material exists (create it if not, optionally using "on behalf of" for the intern)
2. Navigate to Coffee Grounds → Compostability articles
3. Click "Add Article"
4. Copy the content from the incorrectly submitted material
5. Select the intern in "Post on behalf of"
6. Save the article
7. Delete the incorrectly submitted material

The intern's article now appears correctly attributed to them.
