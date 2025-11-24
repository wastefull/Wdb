# Environment-Based Authentication Strategy

**Updated:** October 23, 2025  
**Status:** ✅ Implemented

---

## Overview

WasteDB implements **environment-aware authentication** that adapts based on where the app is running:

- **Figma Make (Testing):** Both Magic Link AND Password authentication available
- **Production (Deployed):** Magic Link authentication ONLY (passwordless)

---

## Why This Design?

### Security Benefits

**Production (Passwordless):**
- ✅ No passwords to remember or manage
- ✅ No password reuse vulnerabilities
- ✅ No brute force attacks on passwords
- ✅ Reduced attack surface
- ✅ Better user experience
- ✅ Industry best practice (Auth0, Supabase, etc.)

**Figma Make (Testing):**
- ✅ Faster testing workflow (no email required)
- ✅ Offline testing capability
- ✅ Traditional auth for debugging
- ✅ Rapid iteration during development

---

## Implementation

### File Structure

```
/utils/environment.ts          # Environment detection utilities
/components/AuthView.tsx        # Updated with conditional rendering
/docs/ENVIRONMENT_AUTH_STRATEGY.md  # This file
```

---

## Environment Detection

### Detection Logic

**File:** `/utils/environment.ts`

```typescript
export function isFigmaMake(): boolean {
  const hostname = window.location.hostname;
  
  return (
    hostname.includes('figma.com') ||  // make.figma.com
    hostname.includes('figma.io') ||   // *.figma.io
    hostname === 'localhost' ||        // Local development
    hostname === '127.0.0.1'           // Local IP
  );
}
```

### API Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `isFigmaMake()` | `boolean` | True if in Figma Make/local |
| `isProduction()` | `boolean` | True if in production |
| `getEnvironment()` | `'figma-make' \| 'production'` | Current environment |
| `logEnvironmentInfo()` | `void` | Logs debug info to console |

---

## UI Behavior

### Figma Make (Testing)

**Login Screen:**
```
┌─────────────────────────────────────┐
│         WasteDB                     │
│   Material Sustainability Database  │
│                                     │
│  🔒 Protected by rate limiting...   │
│                                     │
│  ┌───────────┬───────────┐         │
│  │ Magic Link│ Password  │ ← BOTH  │
│  └───────────┴───────────┘         │
│                                     │
│  [Shows selected auth form]         │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Toggle between Magic Link and Password
- Both authentication methods available
- Full Sign Up / Sign In flows
- Password visibility toggle
- Email confirmation notices

---

### Production (Deployed)

**Login Screen:**
```
┌─────────────────────────────────────┐
│         WasteDB                     │
│   Material Sustainability Database  │
│                                     │
│  🔒 Protected by rate limiting...   │
│  ✉️ Secure passwordless auth        │
│                                     │
│  Email Address:                     │
│  [you@example.com]                  │
│                                     │
│  ✨ No password needed! We'll send │
│     a secure sign-in link...        │
│                                     │
│  [Send Magic Link]                  │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Magic Link ONLY
- No password toggle visible
- Cleaner, simpler interface
- Auto-redirects if somehow on password mode
- Professional UX

---

## Code Changes

### AuthView.tsx Updates

**1. Added Environment Detection:**
```typescript
import { isFigmaMake, logEnvironmentInfo } from '../utils/environment';

const showPasswordAuth = isFigmaMake();
```

**2. Conditional Toggle Rendering:**
```typescript
{/* Auth Mode Toggle - Only show in Figma Make */}
{authMode !== 'magic-link-sent' && showPasswordAuth && (
  <div className="mb-6 flex gap-2">
    {/* Magic Link and Password buttons */}
  </div>
)}
```

**3. Production Notice:**
```typescript
{/* Production Mode - Magic Link Only Notice */}
{authMode !== 'magic-link-sent' && !showPasswordAuth && (
  <div className="mb-6 p-3 bg-[#e4e3ac]/30...">
    <p>Secure passwordless authentication</p>
  </div>
)}
```

**4. Form Conditional:**
```typescript
) : authMode === 'traditional' && showPasswordAuth ? (
  {/* Password form - only in Figma Make */}
) : (
  {/* Fallback: redirect to Magic Link */}
)
```

**5. Auto-Redirect Effect:**
```typescript
useEffect(() => {
  if (!showPasswordAuth && authMode === 'traditional') {
    console.log('🔄 Switching to Magic Link auth in production');
    setAuthMode('magic-link');
  }
}, [showPasswordAuth, authMode]);
```

---

## Testing

### Test in Figma Make

**1. Verify Environment Detection:**
```
Open browser console:
🌍 Environment Detection: {
  environment: 'figma-make',
  isFigmaMake: true,
  isProduction: false,
  hostname: 'make.figma.com',
  ...
}
```

**2. Verify Both Auth Methods:**
- ✅ See "Magic Link" and "Password" toggle
- ✅ Can switch between both
- ✅ Both work correctly
- ✅ Password form shows Sign In/Sign Up buttons

---

### Test in Production

**1. Verify Environment Detection:**
```
Open browser console:
🌍 Environment Detection: {
  environment: 'production',
  isFigmaMake: false,
  isProduction: true,
  hostname: 'yourdomain.com',
  ...
}
```

**2. Verify Magic Link Only:**
- ✅ NO "Password" toggle visible
- ✅ Only Magic Link interface shown
- ✅ "Secure passwordless authentication" notice visible
- ✅ Cannot access password form
- ✅ Clean, simple interface

---

### Test Auto-Redirect

**1. Manually Force Password Mode in Production:**
```typescript
// In browser console:
// This should auto-redirect to magic-link
setAuthMode('traditional')
```

**Expected:**
- Immediately redirects back to 'magic-link'
- Console log: "🔄 Switching to Magic Link auth in production"
- User never sees password form

---

## Security Considerations

### Why Magic Link is More Secure

**Password Vulnerabilities:**
- ❌ Weak passwords
- ❌ Password reuse across sites
- ❌ Brute force attacks
- ❌ Password database breaches
- ❌ Social engineering / phishing
- ❌ Keyloggers
- ❌ Password reset vulnerabilities

**Magic Link Advantages:**
- ✅ No password to compromise
- ✅ Time-limited (1 hour expiry)
- ✅ Single-use tokens
- ✅ Email-based verification
- ✅ Phishing resistant (unique URLs)
- ✅ No credential stuffing
- ✅ Simpler user experience

### Email Security is Key

**Magic Link relies on:**
1. ✅ Email account security (user's responsibility)
2. ✅ HTTPS transport (Supabase provides)
3. ✅ Token expiration (1 hour)
4. ✅ Rate limiting (10 req/min)
5. ✅ Honeypot anti-bot measures

**Best practice:** Encourage users to enable 2FA on their email accounts.

---

## Admin Access

### How Admin Role Works

**Backend Logic (unchanged):**
```typescript
// /supabase/functions/server/index.tsx
if (email.endsWith('@wastefull.org')) {
  role = 'admin';
} else {
  role = 'user';
}
```

**Works with BOTH auth methods:**
- ✅ Magic Link: Admin role assigned if @wastefull.org
- ✅ Password: Admin role assigned if @wastefull.org

**No UI hint:** As per security update, we don't advertise this in the UI.

---

## Migration Notes

### Existing Users

**Users with passwords:**
- ✅ Can still use Magic Link
- ✅ Password still works in Figma Make (for testing)
- ✅ Password NOT available in production (use Magic Link)

**Recommendation:**
- Encourage all users to switch to Magic Link
- Consider deprecating password auth entirely in future

### Future Improvements

**Consider:**
1. Social auth (Google, GitHub)
2. WebAuthn / Passkeys
3. Multi-factor authentication (MFA)
4. Session management improvements

---

## Troubleshooting

### Issue: "Password button still showing in production"

**Check:**
1. Verify hostname detection:
   ```typescript
   console.log(window.location.hostname);
   console.log(isFigmaMake());
   ```

2. Check if hostname is in detection list:
   ```typescript
   // Add your production hostname if needed
   return hostname === 'yourdomain.com' ? false : isFigmaMake();
   ```

---

### Issue: "Can't test password auth in Figma Make"

**Check:**
1. Confirm running in Figma Make environment
2. Check browser console for environment logs
3. Verify `showPasswordAuth` is `true`
4. Clear cache and reload

---

### Issue: "Magic link not sending"

**Check:**
1. Email configuration in Supabase
2. Rate limiting (max 10 requests/min)
3. Honeypot field (must be empty)
4. Console logs for API errors
5. Supabase dashboard for email logs

See: `/docs/MAGIC_LINK_TEST_GUIDE.md`

---

## Related Documentation

- `/docs/SECURITY.md` - Complete security documentation
- `/docs/SECURITY_UPDATE_OCT_22.md` - Admin hint removal
- `/docs/ROLES_AND_PERMISSIONS.md` - Role system
- `/docs/MAGIC_LINK_TEST_GUIDE.md` - Magic Link testing
- `/docs/EMAIL_CONFIRMATION_SETUP.md` - Email setup

---

## API Reference

### Environment Detection

```typescript
import { 
  isFigmaMake, 
  isProduction, 
  getEnvironment,
  logEnvironmentInfo 
} from '../utils/environment';

// Check if in Figma Make
if (isFigmaMake()) {
  console.log('Running in Figma Make!');
}

// Check if in production
if (isProduction()) {
  console.log('Running in production!');
}

// Get environment name
const env = getEnvironment(); // 'figma-make' | 'production'

// Log debug info
logEnvironmentInfo();
```

---

## Deployment Checklist

**Before deploying to production:**

- [ ] Verify environment detection works
- [ ] Test Magic Link flow end-to-end
- [ ] Confirm password toggle is hidden
- [ ] Check email configuration in Supabase
- [ ] Verify rate limiting is active
- [ ] Test with @wastefull.org for admin access
- [ ] Confirm auto-redirect works
- [ ] Check mobile responsiveness
- [ ] Test error handling
- [ ] Review console logs

---

## Summary

✅ **Environment detection implemented**  
✅ **Password auth hidden in production**  
✅ **Password auth available in Figma Make**  
✅ **Auto-redirect prevents password access in production**  
✅ **Cleaner, more secure UX for end users**  
✅ **Flexible testing workflow for developers**  

**Status:** Complete - Ready for use

---

**Last Updated:** October 23, 2025  
**Version:** 1.0  
**Author:** WasteDB Development Team
