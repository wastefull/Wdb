# Authentication Error Handling - Security Update

**Updated:** December 18, 2025
**Date:** November 10, 2025  
**Status:** ✅ Implemented

---

## 🔐 Overview

Implemented secure error handling for authentication failures (401 Unauthorized, 403 Forbidden) with proper session cleanup and user redirection.

---

## Problems Solved

### Before:

1. ❌ **API endpoints exposed in console logs** during auth errors
2. ❌ **Users stuck on protected pages** after session expiry
3. ❌ **Technical error messages** exposed to end users
4. ❌ **Only 401 handled**, 403 errors ignored
5. ❌ **Inconsistent error handling** across components

### After:

1. ✅ **No endpoint logging in production** (only in test mode)
2. ✅ **Automatic redirect** to front page on auth failure
3. ✅ **User-friendly toast messages** ("Your session has expired...")
4. ✅ **Both 401 and 403 handled** consistently
5. ✅ **Centralized error handling** in `apiCall()`

---

## 🔧 Implementation Details

### 1. Enhanced `apiCall()` Error Handling

**Location:** `/utils/api.tsx`

```typescript
// Detects both 401 (Unauthorized) and 403 (Forbidden)
const isAuthError = response.status === 401 || response.status === 403;
const isAuthEndpoint = endpoint.includes("/auth/");

// Handle session expiry for non-auth endpoints
if (isAuthError && !isAuthEndpoint) {
  // Clear session data
  clearAccessToken();
  sessionStorage.removeItem("wastedb_user");

  // Show user-friendly message
  if (response.status === 401) {
    toast.error("Your session has expired. Please sign in again.");
  } else if (response.status === 403) {
    toast.error("You do not have permission to perform this action.");
  }

  // Trigger redirect callback (set by AuthContext)
  if (onSessionExpired) {
    onSessionExpired();
  }

  // Throw sanitized error
  throw new Error("Authentication required. Please sign in to continue.");
}
```

---

### 2. Conditional Endpoint Logging

**Security Principle:** Don't expose internal API structure in production

```typescript
// Log error WITHOUT exposing full endpoint in production
logger.error("API call failed:", {
  method: options.method || "GET",
  status: response.status,
  statusText: response.statusText,
  // Only log endpoint path in test mode
  ...(logger.isTestMode() ? { endpoint } : {}),
});
```

**Result:**

- **Production:** Logs `{method: 'GET', status: 401, statusText: 'Unauthorized'}`
- **Test Mode:** Logs `{method: 'GET', status: 401, statusText: 'Unauthorized', endpoint: '/materials/123'}`

---

### 3. Secure Logger Update

**Location:** `/utils/logger.ts`

Changed `error()` function to respect test mode:

```typescript
// BEFORE: Always logged errors
export function error(...args: any[]): void {
  console.error(...args);
}

// AFTER: Only logs in test mode
export function error(...args: any[]): void {
  if (isTestMode()) {
    console.error(...args);
  }
}
```

**Added:** `isTestMode()` method to logger exports

---

### 4. Session Expiry Flow

```
User Action (with expired token)
    ↓
API Call to Protected Endpoint
    ↓
Server Returns 401/403
    ↓
apiCall() Detects Auth Error
    ↓
┌─────────────────────────────┐
│ 1. Clear Session Data       │
│ 2. Show User-Friendly Toast │
│ 3. Call onSessionExpired()  │
│ 4. Throw Sanitized Error    │
└─────────────────────────────┘
    ↓
AuthContext.onSessionExpired()
    ↓
Navigate to Materials List (Front Page)
    ↓
User Can Sign In Again
```

---

## 🛡️ Security Improvements

| Area                  | Before                                          | After                                           |
| --------------------- | ----------------------------------------------- | ----------------------------------------------- |
| **Endpoint Exposure** | Always logged                                   | Only in test mode                               |
| **Error Messages**    | Technical (`API call failed: /admin/users 403`) | User-friendly (`You do not have permission...`) |
| **403 Handling**      | ❌ Not handled                                  | ✅ Handled with permission message              |
| **Session Cleanup**   | Partial (only 401)                              | Complete (401 & 403)                            |
| **User Experience**   | Stuck on error page                             | Auto-redirect to front page                     |
| **Console Pollution** | All errors visible                              | Clean in production                             |

---

## 🧪 Testing

### Test Session Expiry:

1. Sign in as admin
2. Open DevTools → Application → Session Storage
3. Delete `wastedb_access_token`
4. Try to perform admin action (e.g., edit material)
5. **Expected:**
   - Toast: "Your session has expired. Please sign in again."
   - Redirect to materials list
   - No endpoints logged in console (production)

### Test Permission Denied:

1. Sign in as regular user
2. Try to access admin-only endpoint (if manually calling API)
3. **Expected:**
   - Toast: "You do not have permission to perform this action."
   - Redirect to front page
   - Clean error handling

---

## 📋 Related Files

- `/utils/api.tsx` - Core error handling logic
- `/utils/logger.ts` - Conditional logging system
- `/contexts/AuthContext.tsx` - Session expiry callback registration
- `/App.tsx` - onSessionExpired implementation
- `/Bug_Tracker.md` - Issue tracking

---

## ⚠️ Important Notes

1. **Test Mode Detection (Environment-Based):**

   - **localhost:** `TEST_MODE = true` (endpoints logged for debugging)
   - **Production (db.wastefull.org):** `TEST_MODE = false` (endpoints hidden, logs suppressed)
   - **Manual Override:** Available via `window.wastedbLogger.setTestMode(true/false)`
   - **Automatic:** No explicit flag needed - detects environment on load

2. **Auth Endpoint Exemption:**

   - `/auth/signup`, `/auth/signin`, `/auth/magic-link` are exempt from session expiry handling
   - This prevents redirect loops during login

3. **Error Message Sanitization:**
   - Never expose internal endpoint paths to users
   - Use generic messages for 500 errors: "Server error. Please try again later."
   - Specific messages only for user-actionable errors (401, 403)

---

## User Experience Impact

### Before Session Expiry Fix:

```
User sees: "API call failed: /materials/123 401"
User thinks: "What's an API? What's /materials/123?"
User action: Confused, closes tab
```

### After Session Expiry Fix:

```
User sees: "Your session has expired. Please sign in again."
User thinks: "Oh, I need to log back in."
User action: Signs in, continues working
```

---

## ✅ Checklist

- [x] 401 Unauthorized handled
- [x] 403 Forbidden handled
- [x] Session cleanup on auth errors
- [x] User-friendly toast messages
- [x] Automatic redirect to front page
- [x] Endpoint logging conditional on test mode
- [x] Error message sanitization
- [x] AuthContext callback integration
- [x] Logger security improvements
- [x] Documentation updated

---

**Result:** Secure, user-friendly authentication error handling with no information disclosure in production. 🎉
