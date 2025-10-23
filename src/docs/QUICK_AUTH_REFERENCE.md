# Quick Authentication Reference

**One-page guide for WasteDB authentication**

---

## 🔐 What Auth Method Should I Use?

### In Production (Deployed App)
**→ Magic Link ONLY** ✉️

### In Figma Make (Testing)
**→ Magic Link OR Password** 🔄

---

## 🚀 How to Sign In

### Production Users

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

**Option 1: Magic Link** (Same as production)

**Option 2: Password** (Fast testing)
```
1. Toggle to "Password"
2. Enter email + password
3. Click "Sign In"
```

---

## 🎯 Quick Facts

| Feature | Production | Figma Make |
|---------|-----------|------------|
| Magic Link | ✅ | ✅ |
| Password | ❌ | ✅ |
| Toggle visible | ❌ | ✅ |
| Email required | ✅ | ✅ (Magic Link) |
| Admin access | @wastefull.org | @wastefull.org |

---

## 🔍 How to Check Your Environment

**Open browser console:**
```javascript
// Check environment
console.log(window.location.hostname);

// Figma Make hostnames:
// - make.figma.com
// - *.figma.io
// - localhost

// Production:
// - Your custom domain
```

---

## 🛠️ Troubleshooting

### "I don't see the Password button"

**You're in production!**
- Password auth is disabled for security
- Use Magic Link instead
- It's more secure and easier to use

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
import { isFigmaMake, isProduction } from '../utils/environment';

if (isFigmaMake()) {
  console.log('Testing environment');
}

if (isProduction()) {
  console.log('Production environment');
}
```

**Console logs:**
```
🌍 Environment Detection: {
  environment: 'figma-make',
  isFigmaMake: true,
  isProduction: false,
  hostname: 'make.figma.com'
}
```

---

## 📚 Related Docs

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
POST /auth/magic-link
Status: 200
Response: { message: "Magic link sent!" }
```

### Check if signed in
```javascript
// In console:
sessionStorage.getItem('wastedb_access_token')
// Returns token if signed in, null if not
```

### Sign out
```javascript
// Click sign out button, or:
sessionStorage.removeItem('wastedb_access_token')
sessionStorage.removeItem('wastedb_user')
```

---

## 🎉 Summary

**Production:** Magic Link only (passwordless) ✉️  
**Figma Make:** Magic Link + Password (testing) 🔄  
**Admin:** @wastefull.org emails 👨‍💼  
**Security:** Best practices ✅  

---

**Updated:** October 23, 2025  
**Version:** 1.0
