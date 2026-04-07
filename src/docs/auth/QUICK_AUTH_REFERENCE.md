# Quick Authentication Reference

**Updated:** April 7, 2026
**One-page guide for WasteDB authentication**

---

## 🔐 What Auth Method Should I Use?

### In Production (Deployed App)

**→ Google OAuth (@wastefull.org) OR Magic Link**

### in localhost (Testing)

**→ Google OAuth OR Magic Link OR Password**

---

## How to Sign In

### Production Users

**Option 1: Continue with Google (recommended for org members)**

```
1. Click "Continue with Google (@wastefull.org)"
2. Choose your Wastefull Google account
3. Return to WasteDB signed in
```

**Option 2: Magic Link**

**1. Enter your email**

```
you@example.com
```

**2. Click "Send Magic Link"**

```
→ Email sent
→ Check your inbox
```

**3. Click the link in your email**

```
→ Automatically signed in
→ No password needed!
```

---

### Figma Make Users (Testing)

**Option 1: Google OAuth**

**Option 2: Magic Link**

**Option 3: Password** (Fast testing)

```
1. Toggle to "Password"
2. Enter email + password
3. Click "Sign In"
```

---

## Quick Facts

| Feature               | Production                  | Local Dev                   |
| --------------------- | --------------------------- | --------------------------- |
| Google OAuth          | ✅                          | ✅                          |
| Magic Link            | ✅                          | ✅                          |
| Password              | ❌                          | ✅                          |
| OAuth org restriction | ✅                          | ✅                          |
| Linked email aliases  | ✅                          | ✅                          |
| Admin access          | @wastefull.org + role rules | @wastefull.org + role rules |

---

## How to Check Your Environment

**Open browser console:**

```javascript
// Check environment
console.log(window.location.hostname);

// Development hostnames:
// - localhost

// Production:
// - Your custom domain
```

---

## 🛠️ Troubleshooting

### "I don't see the Password button"

**You're in production!**

- Password auth is disabled for security
- Use Google OAuth or Magic Link instead
- It's more secure and easier to use

---

### "Google sign-in says restricted"

- Google OAuth only accepts verified `@wastefull.org` accounts
- Use Magic Link for non-org accounts
- If your org Google email should map to an older non-org account, an admin can link them via email alias

See: `src/docs/auth/GOOGLE_OAUTH_SETUP.md`

---

### "Magic Link not arriving"

**Check:**

1. ✅ Spam/Junk folder
2. ✅ Email address is correct
3. ✅ Rate limit (10 links/minute max)
4. ✅ Supabase email configuration

**See:** `/docs/MAGIC_LINK_TEST_GUIDE.md`

---

### "Link expired"

**Magic Links expire after 1 hour**

- Request a new link
- Sign in immediately when received
- Check email time zone settings

---

## 👨‍💼 Admin Access

**Who gets admin access?**

```
Emails ending in: @wastefull.org
Everyone else: Regular user
```

**What can admins do?**

- ✅ Create materials
- ✅ Edit materials
- ✅ Delete materials
- ✅ Manage users
- ✅ Edit whitepapers
- ✅ Batch operations

**What can regular users do?**

- ✅ View materials
- ✅ Read whitepapers
- ✅ View visualizations
- ❌ Cannot edit/delete

**See:** `/docs/ROLES_AND_PERMISSIONS.md`

---

## 📱 Mobile Experience

**Production (Magic Link only):**

```
┌──────────────────┐
│    WasteDB       │
│                  │
│  Email:          │
│  [_____________] │
│                  │
│  [Send Link]     │
└──────────────────┘
```

**Simple, clean, fast!**

---

## 🔐 Security

**Why Magic Link in production?**

**Advantages:**

- ✅ No password to remember
- ✅ No password to steal
- ✅ No brute force attacks
- ✅ Time-limited (1 hour)
- ✅ Single-use tokens
- ✅ Email-based verification

**Password vulnerabilities:**

- ❌ Weak passwords
- ❌ Password reuse
- ❌ Brute force
- ❌ Phishing
- ❌ Database breaches

**See:** `/docs/SECURITY.md`

---

## 💻 For Developers

**Environment detection:**

```typescript
import { isFigmaMake, isProduction } from "../utils/environment";

if (isFigmaMake()) {
  console.log("Testing environment");
}

if (isProduction()) {
  console.log("Production environment");
}
```

**Console logs:**

```
🌍 Environment Detection: {
  environment: 'development',
  isDevelopment: true,
  isProduction: false,
  hostname: 'localhost'
}
```

---

## Related Docs

**Authentication:**

- `/docs/ENVIRONMENT_AUTH_STRATEGY.md` - Complete strategy
- `/docs/AUTH_UI_COMPARISON.md` - Visual comparison
- `/docs/MAGIC_LINK_TEST_GUIDE.md` - Testing guide

**Security:**

- `/docs/SECURITY.md` - Security overview
- `/docs/SECURITY_UPDATE_OCT_22.md` - Recent updates
- `/docs/ROLES_AND_PERMISSIONS.md` - Access control

**Email:**

- `/docs/EMAIL_CONFIRMATION_SETUP.md` - Email setup
- `/docs/EMAIL_SETUP_CHECKLIST.md` - Checklist

---

## ⚡ Quick Commands

### Check if Magic Link sent

```javascript
// Check network tab for:
POST / auth / magic - link;
Status: 200;
Response: {
  message: "Magic link sent!";
}
```

### Check if signed in

```javascript
// In console:
sessionStorage.getItem("wastedb_access_token");
// Returns token if signed in, null if not
```

### Sign out

```javascript
// Click sign out button, or:
sessionStorage.removeItem("wastedb_access_token");
sessionStorage.removeItem("wastedb_user");
```

---

## 🎉 Summary

**Production:** Google OAuth + Magic Link  
**Figma Make:** Google OAuth + Magic Link + Password  
**Admin:** Role-based, with @wastefull.org org policy  
**Security:** Best practices ✅

---

**Updated:** April 7, 2026  
**Version:** 1.1
