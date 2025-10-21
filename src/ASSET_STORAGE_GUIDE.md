# Asset Storage Guide

## Overview

WasteDB now includes a Supabase Storage-based CDN for hosting static assets like logos, images, and other files used in emails and the application.

## Features

✅ **Public bucket** for easy access  
✅ **5MB file size limit** per asset  
✅ **Supported formats**: PNG, JPG, SVG, WebP  
✅ **Admin-only uploads** (requires admin authentication)  
✅ **Permanent public URLs** for use anywhere  

## How to Upload Assets

### Step 1: Sign in as Admin
1. Sign in to WasteDB with an admin account (e.g., natto@wastefull.org)
2. Make sure you're authenticated

### Step 2: Navigate to Asset Manager
1. Click **"Database Management"** from the main materials view
2. Click the **"Assets"** tab
3. You'll see the Asset Upload Manager

### Step 3: Upload Your Logo
1. Click **"Choose File"** or drag and drop
2. Select your Wastefull logo (PNG, SVG, or JPG recommended)
3. Wait for the upload to complete
4. You'll see a success message with the file name

### Step 4: Copy the Public URL
1. Find your uploaded logo in the assets list
2. Click the **Copy** icon (📋) to copy the public URL
3. The URL will look like: `https://[project-id].supabase.co/storage/v1/object/public/make-17cae920-assets/logo-[timestamp].png`

### Step 5: Use in Magic Link Emails
1. Open `/supabase/functions/server/index.tsx`
2. Find the `sendMagicLinkEmail` function (around line 470)
3. Replace the `<img>` tag with your logo URL:

```typescript
<img 
  src="https://[your-copied-url]" 
  alt="Wastefull Logo" 
  style="max-width: 150px; height: auto;"
/>
```

## API Endpoints

### Upload Asset
**POST** `/make-server-17cae920/assets/upload`  
- Requires: Admin authentication
- Body: FormData with `file` field
- Returns: `{ publicUrl, fileName, size, type }`

### List Assets
**GET** `/make-server-17cae920/assets`  
- Requires: Admin authentication
- Returns: Array of assets with public URLs

### Delete Asset
**DELETE** `/make-server-17cae920/assets/:fileName`  
- Requires: Admin authentication
- Returns: `{ success: true }`

## Storage Details

- **Bucket Name**: `make-17cae920-assets`
- **Access**: Public (read-only for everyone, upload/delete admin-only)
- **Location**: Supabase Storage
- **Quota**: Supabase free tier includes 1GB storage + 2GB bandwidth

## Troubleshooting

**"Failed to upload file"**
- Check file size (must be < 5MB)
- Verify file type is supported (PNG, JPG, SVG, WebP)
- Ensure you're signed in as admin

**"Unauthorized"**
- Your session may have expired - sign in again
- Make sure you have admin role

**Assets not loading**
- Check that DNS/SSL is fully propagated for db.wastefull.org
- Verify the Supabase project is accessible
- Check browser console for CORS errors

## Next Steps

Once you've uploaded your logo:
1. ✅ Copy the public URL
2. ✅ Update the magic link email template
3. ✅ Test the email delivery with your verified sender (auth@wastefull.org)
4. ✅ Verify the logo displays correctly in received emails

## Security Notes

- ✅ Uploads require admin authentication
- ✅ Public bucket is read-only for non-admins
- ✅ File type validation prevents malicious uploads
- ✅ 5MB size limit prevents abuse
- ✅ No executable files allowed
