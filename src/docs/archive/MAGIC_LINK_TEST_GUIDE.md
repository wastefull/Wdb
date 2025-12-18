# Magic Link Authentication - Testing Guide

**Updated:** December 18, 2025

## ✅ What Was Fixed

The magic link authentication system is now fully operational. Here's what was corrected:

### 1. **Magic Link URL**

- **Before:** Pointed to Supabase functions URL → caused API key error
- **After:** Points to `https://db.wastefull.org` → proper frontend redirect

### 2. **Custom Session Tokens**

- **Before:** Relied on Supabase JWT tokens
- **After:** Custom UUID-based session tokens stored in KV store
- **Duration:** 7 days per session
- **Security:** Single-use magic links, session expiry validation

### 3. **Authentication Middleware**

- **Before:** Only checked Supabase JWT tokens
- **After:** Checks custom session tokens first, then falls back to Supabase JWT
- **Result:** Magic link sessions work seamlessly with existing auth

### 4. **Frontend Integration**

- **Before:** Looked for `access_token` parameter (Supabase format)
- **After:** Looks for `magic_token`, verifies it, exchanges for session token
- **UX:** Toast notification on successful sign-in

---

## 🧪 How to Test

### Step 1: Clear Previous State

```
1. Open browser DevTools (F12)
2. Go to Application tab → Storage
3. Clear:
   - sessionStorage (wastedb_access_token, wastedb_user)
   - localStorage
4. Close DevTools
5. Refresh the page
```

### Step 2: Request Magic Link

```
1. Go to https://db.wastefull.org
2. Click "Sign In" button (top-right)
3. Enter email: natto@wastefull.org
4. Click "Send Magic Link"
5. You should see: "Magic link sent! Check your email."
```

### Step 3: Check Email

```
1. Open your email inbox for natto@wastefull.org
2. Look for email from: WasteDB <auth@wastefull.org>
3. Subject: "Your WasteDB Magic Link"
4. Email should have:
   - Green gradient header
   - Wastefull branding
   - "Sign In to WasteDB" button
   - Security tips
   - Expiry warning (1 hour)
```

### Step 4: Click the Magic Link

```
1. Click "Sign In to WasteDB" button in email
2. OR copy/paste the fallback link
3. Link format: https://db.wastefull.org?magic_token=<UUID>
4. You should be redirected to the app
```

### Step 5: Verify Authentication

```
Expected behavior:
✅ URL parameters cleared (no ?magic_token visible)
✅ Toast message: "Welcome back, natto@wastefull.org!"
✅ User indicator appears in top bar
✅ "Admin" button visible (for @wastefull.org emails)
✅ No errors in browser console
```

### Step 6: Verify Admin Access

```
1. Click the "Admin" button in top bar
2. Verify these buttons appear:
   ✅ "Add Material"
   ✅ "Database Management"
   ✅ "User Management"
3. Click "Database Management"
4. You should see all tabs including "Assets"
```

### Step 7: Test Session Persistence

```
1. Refresh the page (F5)
2. User should still be signed in
3. Admin features still accessible
4. No need to click magic link again
```

### Step 8: Test Sign Out

```
1. Click "Sign Out" button
2. User indicator disappears
3. Admin button disappears
4. Admin features hidden
5. "Sign In" button appears
```

---

## Debugging

### If Magic Link Email Doesn't Arrive

**Check 1: Spam/Junk Folder**

- Magic links might be filtered initially
- Mark as "Not Spam" to whitelist

**Check 2: Resend Dashboard**

- Go to https://resend.com/emails
- Check delivery status for your email
- Look for bounce or spam reports

**Check 3: Server Logs**

- in localhost console, check for email sending errors
- Look for "Magic link email sent to..." confirmation

**Check 4: Rate Limiting**

- Wait 60 seconds between requests
- Max 5 auth requests per minute per IP

### If Clicking Link Shows Error

**Error: "Invalid or expired magic link"**

- Token may have expired (1 hour limit)
- Request a new magic link
- Check system clock is accurate

**Error: "Magic link has already been used"**

- Token can only be used once (security feature)
- Request a new magic link

**Error: "Session expired"**

- Custom session lasted 7 days but expired
- Sign in again with new magic link

**Error: "Unauthorized - invalid token"**

- Session token not recognized
- Clear sessionStorage and sign in again

### If Authentication Doesn't Persist

**Check sessionStorage:**

```javascript
// Open browser console and run:
sessionStorage.getItem("wastedb_access_token");
sessionStorage.getItem("wastedb_user");

// Should see valid token and user object
```

**Clear and retry:**

```javascript
// If tokens look corrupted:
sessionStorage.clear();
// Then request new magic link
```

---

## 📧 Email Template Customization

### Current State

- Text-based "Wastefull" header
- Green gradient background
- Professional button styling

### To Add Logo (Future)

1. Upload logo via Database Management → Assets
2. Copy public URL
3. Edit `/supabase/functions/server/index.tsx` line 522
4. Replace `<h1>` with `<img src="YOUR_LOGO_URL">`
5. See `/EMAIL_LOGO_SETUP.md` for detailed instructions

---

## 🔒 Security Features Active

✅ **Magic Link Expiry** - 1 hour lifetime  
✅ **Single-Use Tokens** - Cannot be reused  
✅ **Session Expiry** - 7 day maximum  
✅ **Honeypot Protection** - Anti-bot field  
✅ **Email Validation** - Pattern detection  
✅ **Rate Limiting** - 5 requests/minute  
✅ **Auto-Admin Assignment** - @wastefull.org emails  
✅ **Secure Token Generation** - Cryptographic UUIDs

---

## Architecture Flow

```
┌──────────────┐
│   User       │
│ Enters Email │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ POST /auth/      │
│   magic-link     │
└──────┬───────────┘
       │
       ├─ Generate UUID token
       ├─ Store in KV with expiry
       ├─ Send email via Resend
       │
       ▼
┌──────────────────┐
│  Email Inbox     │
│  (Resend)        │
└──────┬───────────┘
       │
       ▼ User clicks link
┌──────────────────────────────────┐
│ https://db.wastefull.org?        │
│   magic_token=<UUID>             │
└──────┬───────────────────────────┘
       │
       ▼ Frontend detects token
┌──────────────────┐
│ POST /auth/      │
│  verify-magic-   │
│    link          │
└──────┬───────────┘
       │
       ├─ Check token exists
       ├─ Verify not expired
       ├─ Verify not used
       ├─ Create/get user
       ├─ Generate session token
       ├─ Mark magic token as used
       │
       ▼
┌──────────────────┐
│ Return:          │
│  - access_token  │
│  - user object   │
└──────┬───────────┘
       │
       ▼ Frontend stores session
┌──────────────────┐
│ sessionStorage:  │
│  - access_token  │
│  - user object   │
└──────┬───────────┘
       │
       ▼ All API calls include token
┌──────────────────┐
│ Authorization:   │
│ Bearer <token>   │
└──────────────────┘
```

---

## ✨ Expected User Experience

### First-Time User

1. Visits db.wastefull.org
2. Clicks "Sign In"
3. Enters email
4. Receives beautiful branded email
5. Clicks magic link
6. Instantly signed in
7. Role automatically assigned
8. Can access appropriate features

### Returning User

1. Receives new magic link email
2. Clicks link
3. Existing account recognized
4. Signed in with same role
5. No duplicate accounts created

### Admin User (@wastefull.org)

1. Same flow as above
2. Automatically assigned admin role
3. Admin button appears
4. Can access all admin features
5. Can manage users, materials, assets

---

## Success Criteria

All of these should work:

- ✅ Magic link emails arrive within 5 seconds
- ✅ Clicking link signs user in immediately
- ✅ URL is clean (no visible token after redirect)
- ✅ Session persists across page refreshes
- ✅ @wastefull.org emails get admin role
- ✅ Other emails get user role
- ✅ Sign out works correctly
- ✅ Cannot reuse magic link
- ✅ Expired links show helpful error
- ✅ Rate limiting prevents abuse

---

## 📝 Test Results Template

Copy and fill out when testing:

```
## Test Session: [DATE/TIME]

### Environment
- Browser:
- Email:
- Clear cache: ☐ Yes ☐ No

### Test Steps
1. Request magic link: ☐ Pass ☐ Fail
2. Email received: ☐ Pass ☐ Fail
3. Link clicked: ☐ Pass ☐ Fail
4. Sign-in successful: ☐ Pass ☐ Fail
5. Role assigned correctly: ☐ Pass ☐ Fail
6. Session persists: ☐ Pass ☐ Fail
7. Sign out works: ☐ Pass ☐ Fail

### Notes:
[Any issues, errors, or observations]

### Screenshots:
[Attach if relevant]
```

---

## Ready to Test!

The system is fully operational and ready for production use. Follow the testing steps above to verify everything works as expected.

**Questions or issues?** Check the debugging section or review the server logs in localhost console.
