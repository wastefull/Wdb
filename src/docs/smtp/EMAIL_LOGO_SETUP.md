# How to Add Logo to Magic Link Emails

## Quick Steps

### 1. Upload Your Logo
1. Sign in to WasteDB as admin (natto@wastefull.org)
2. Navigate to: **Database Management → Assets tab**
3. Click "Choose File" and upload your Wastefull logo (PNG/SVG recommended)
4. Click the **Copy icon** (📋) next to your uploaded logo
5. Save the copied URL - it will look like:
   ```
   https://[project-id].supabase.co/storage/v1/object/public/make-17cae920-assets/logo-[timestamp].png
   ```

### 2. Update the Email Template
Open `/supabase/functions/server/index.tsx` and find **line 522** (inside the `sendMagicLinkEmail` function).

**Current code (line 521-523):**
```html
<div style="background: white; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 15px;">
  <h1 style="color: #65a30d; margin: 0; font-size: 32px; font-family: 'Comic Sans MS', cursive, sans-serif;">Wastefull</h1>
</div>
```

**Replace with:**
```html
<div style="background: white; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 15px;">
  <img 
    src="YOUR_COPIED_LOGO_URL_HERE" 
    alt="Wastefull Logo" 
    style="max-width: 150px; height: auto; display: block; margin: 0 auto;"
  />
</div>
```

### 3. Test the Email
1. Go to WasteDB sign-in page
2. Request a magic link
3. Check your email to verify the logo displays correctly

## Example

If your logo URL is:
```
https://abc123.supabase.co/storage/v1/object/public/make-17cae920-assets/wastefull-logo-1234567890.png
```

Replace line 522 with:
```html
<img 
  src="https://abc123.supabase.co/storage/v1/object/public/make-17cae920-assets/wastefull-logo-1234567890.png" 
  alt="Wastefull Logo" 
  style="max-width: 150px; height: auto; display: block; margin: 0 auto;"
/>
```

## Styling Tips

Adjust the `style` attribute to customize appearance:
- **Size**: Change `max-width: 150px` to desired width
- **Alignment**: Use `margin: 0 auto` for center, `margin: 0` for left
- **Spacing**: Add `margin-bottom: 10px` for space below logo

## Troubleshooting

**Logo not showing in email?**
- ✅ Check the URL is public and accessible
- ✅ Verify file uploaded successfully in Assets tab
- ✅ Test URL by opening in browser directly
- ✅ Check email client isn't blocking images

**Logo too large/small?**
- Adjust `max-width` value in the style
- For high-DPI displays, upload 2x size and set smaller max-width

**Want to keep both logo AND text?**
```html
<div style="background: white; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 15px;">
  <img 
    src="YOUR_LOGO_URL" 
    alt="Wastefull Logo" 
    style="max-width: 100px; height: auto; display: block; margin: 0 auto 10px;"
  />
  <h1 style="color: #65a30d; margin: 0; font-size: 24px; font-family: 'Comic Sans MS', cursive, sans-serif;">Wastefull</h1>
</div>
```
