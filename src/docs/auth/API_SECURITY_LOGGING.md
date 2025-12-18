# API Security & Logging Best Practices

**Date:** October 23, 2025  
**Status:** Critical Security Guidelines  
**Priority:** HIGH
**Updated:** December 18, 2025

---

## Overview

This document outlines security best practices for API logging in WasteDB, particularly around authentication tokens and sensitive data.

---

## ⚠️ Critical Security Rules

### Rule #1: Never Log Authentication Tokens

**❌ NEVER DO THIS:**

```typescript
console.log("Token:", token);
console.log("Access token:", token.substring(0, 8) + "...");
console.log("Bearer token:", accessToken);
```

**✅ ALWAYS DO THIS:**

```typescript
logger.log(
  "Token type:",
  token === publicAnonKey ? "anonymous" : "authenticated"
);
logger.log(
  "Authentication status:",
  isAuthenticated ? "authenticated" : "anonymous"
);
```

**Why?**

- Tokens grant full access to user accounts
- Browser console logs can be inspected by anyone with access to the browser
- Tokens may be exposed in error reports, screenshots, or screen recordings
- Even partial tokens (first 8 characters) can aid in brute-force attacks
- Session tokens should be treated as passwords

---

## What Was Changed (October 23, 2025)

### `/utils/api.tsx` Migration

**Security-critical changes:**

#### 1. Removed Token Substring Logging

**Before (INSECURE):**

```typescript
function getAccessToken(): string {
  const token = sessionStorage.getItem("wastedb_access_token") || publicAnonKey;
  console.log(
    "getAccessToken called, returning:",
    token.substring(0, 8) + "...",
    token === publicAnonKey ? "(anon key)" : "(custom token)"
  );
  return token;
}
```

**After (SECURE):**

```typescript
function getAccessToken(): string {
  const token = sessionStorage.getItem("wastedb_access_token") || publicAnonKey;
  logger.log(
    "getAccessToken called, returning:",
    token === publicAnonKey ? "(anon key)" : "(authenticated token)"
  );
  return token;
}
```

**Security improvement:** No token data exposed, only authentication state.

---

#### 2. Removed Token Storage Logging

**Before (INSECURE):**

```typescript
export function setAccessToken(token: string) {
  console.log("setAccessToken called with:", token.substring(0, 8) + "...");
  sessionStorage.setItem("wastedb_access_token", token);
  console.log(
    "Token stored in sessionStorage, verifying:",
    sessionStorage.getItem("wastedb_access_token")?.substring(0, 8) + "..."
  );
}
```

**After (SECURE):**

```typescript
export function setAccessToken(token: string) {
  logger.log("setAccessToken called - storing authenticated token");
  sessionStorage.setItem("wastedb_access_token", token);
  logger.log("Token stored in sessionStorage successfully");
}
```

**Security improvement:** Only logs success/failure, no token data.

---

#### 3. Sanitized API Call Logging

**Before (INSECURE):**

```typescript
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log("🌐 apiCall - Full URL:", fullUrl);
  console.log("🌐 apiCall - Method:", options.method || "GET");
  console.log("🌐 apiCall - Token:", token.substring(0, 8) + "...");
  // ...
}
```

**After (SECURE):**

```typescript
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const isCustomToken = token !== publicAnonKey;

  logger.log("🌐 API Call:", {
    endpoint,
    method: options.method || "GET",
    authType: isCustomToken ? "authenticated" : "anonymous",
  });
  // ...
}
```

**Security improvement:** Logs endpoint and method, but only authentication type, not token.

---

#### 4. Improved Error Logging

**Before (INSECURE):**

```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  // No error logging - silent failures
  throw new Error(errorData.error || `API call failed: ${response.statusText}`);
}
```

**After (SECURE):**

```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));

  logger.error("API call failed:", {
    endpoint,
    status: response.status,
    statusText: response.statusText,
    error: errorData.error || "Unknown error",
  });

  // Clear stale tokens on 401
  if (response.status === 401 && !endpoint.includes("/auth/")) {
    logger.warn("Unauthorized request - clearing stale authentication");
    clearAccessToken();
    sessionStorage.removeItem("wastedb_user");
  }

  throw new Error(errorData.error || `API call failed: ${response.statusText}`);
}
```

**Security improvement:** Errors are logged (critical for debugging) but without sensitive data.

---

#### 5. Magic Link Verification Sanitization

**Before (INSECURE):**

```typescript
export async function verifyMagicLink(token: string): Promise<AuthResponse> {
  console.log("Calling verify-magic-link API with token:", token);
  try {
    const data = await apiCall("/auth/verify-magic-link", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    console.log("Verify-magic-link API response:", data);

    if (data.access_token) {
      console.log("Storing access token from verification:", data.access_token);
      setAccessToken(data.access_token);

      const stored = sessionStorage.getItem("wastedb_access_token");
      console.log(
        "Token stored successfully?",
        stored === data.access_token,
        "stored:",
        stored?.substring(0, 8) + "..."
      );
    }

    return data;
  } catch (error) {
    console.error("Verify-magic-link API error:", error);
    throw error;
  }
}
```

**After (SECURE):**

```typescript
export async function verifyMagicLink(token: string): Promise<AuthResponse> {
  logger.log("Verifying magic link token");
  try {
    const data = await apiCall("/auth/verify-magic-link", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    logger.log("Magic link verification successful");

    if (data.access_token) {
      logger.log("Storing access token from magic link verification");
      setAccessToken(data.access_token);

      const stored = sessionStorage.getItem("wastedb_access_token");
      logger.log("Token stored successfully:", !!stored);
    }

    return data;
  } catch (error) {
    logger.error("Magic link verification failed:", error);
    throw error;
  }
}
```

**Security improvements:**

- No magic link token logged
- No access token logged
- Only boolean success/failure logged
- Errors still logged for debugging (but without token data)

---

## Security Best Practices

### 1. What to Log

**✅ Safe to log:**

- Endpoint names (`/materials`, `/auth/signin`)
- HTTP methods (`GET`, `POST`, `PUT`, `DELETE`)
- Response status codes (`200`, `401`, `500`)
- Authentication state (`authenticated`, `anonymous`)
- Operation success/failure (`true`, `false`)
- Error messages (from server, not containing tokens)
- Data counts (`5 materials loaded`)

**Example:**

```typescript
logger.log("API Call:", {
  endpoint: "/materials",
  method: "GET",
  authType: "authenticated",
  status: 200,
  count: 42,
});
```

---

### 2. What NEVER to Log

**❌ NEVER log:**

- Authentication tokens (full or partial)
- Session IDs
- API keys
- Passwords (obvious, but worth stating)
- Magic link tokens
- Private user data (email, name, unless for debugging with user consent)
- Credit card numbers
- Social security numbers
- Any PII (Personally Identifiable Information) unless absolutely necessary

**Example of what NOT to do:**

```typescript
// ❌ WRONG - SECURITY VULNERABILITY
console.log("User data:", {
  email: user.email,
  token: user.token,
  ssn: user.ssn,
});
```

---

### 3. Error Logging Exceptions

**Errors can be logged more verbosely** because they indicate bugs that need fixing:

```typescript
try {
  await riskyOperation();
} catch (error) {
  // ✅ OK to log full error object
  logger.error("Operation failed:", {
    operation: "riskyOperation",
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  // ❌ But still don't log tokens!
  // logger.error('Operation failed with token:', token);  // WRONG
}
```

---

### 4. Conditional Logging for Sensitive Operations

For highly sensitive operations, consider disabling logging even in development:

```typescript
// For payment processing, auth token generation, etc.
const SENSITIVE_OPERATION = true;

if (!SENSITIVE_OPERATION) {
  logger.log("Processing payment with card:", card.last4);
}

// Or use a separate security-safe logger
import { secureLog } from "./utils/secureLogger";
secureLog("Payment processed"); // Never includes sensitive data
```

---

## Code Review Checklist

When reviewing code that logs data, check:

- [ ] No authentication tokens logged (full or partial)
- [ ] No API keys logged
- [ ] No passwords logged
- [ ] No session IDs logged
- [ ] No magic link tokens logged
- [ ] No PII logged without explicit need
- [ ] Error messages don't contain sensitive data
- [ ] URL parameters don't contain tokens (use POST body instead)
- [ ] Debug logs are suppressed in production (via logger system)

---

## Migration Checklist

When migrating existing code:

- [ ] Replace `console.log(token)` with authentication state logging
- [ ] Remove token substring logging (`token.substring(0, 8)`)
- [ ] Replace token comparisons with boolean checks
- [ ] Use logger methods instead of console.\*
- [ ] Verify no sensitive data in error logs
- [ ] Test in production mode (TEST_MODE = false) to ensure no leaks

---

## Testing Security

### Manual Testing

1. **Enable Production Mode:**

   ```javascript
   wastedbLogger.setTestMode(false);
   ```

2. **Perform Authentication:**

   - Sign in with magic link
   - Check console for token leaks

3. **Check Error Paths:**

   - Trigger 401 errors
   - Check console for token leaks in error messages

4. **Verify Storage:**
   - Open DevTools → Application → Session Storage
   - Confirm tokens are stored but not logged

### Automated Testing

```typescript
describe("API Security", () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log");
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should not log tokens", async () => {
    await signIn("test@example.com", "password");

    const logCalls = consoleLogSpy.mock.calls.flat().join(" ");

    // Verify no token-like strings in logs
    expect(logCalls).not.toMatch(/Bearer [a-zA-Z0-9]+/);
    expect(logCalls).not.toMatch(/eyJ[a-zA-Z0-9]+/); // JWT pattern
    expect(logCalls).not.toMatch(/[a-f0-9]{32}/); // API key pattern
  });
});
```

---

## Incident Response

If a token leak is discovered:

1. **Immediate Actions:**

   - Identify affected users
   - Invalidate compromised tokens (force re-authentication)
   - Remove leaked logs from production
   - Notify security team

2. **Code Fix:**

   - Remove token logging from code
   - Deploy fix immediately
   - Add tests to prevent regression

3. **Post-Incident:**
   - Review all logging code for similar issues
   - Update security documentation
   - Train team on secure logging practices

---

## Examples from WasteDB Migration

### Example 1: Token Storage

**Before:**

```typescript
export function setAccessToken(token: string) {
  console.log("setAccessToken called with:", token.substring(0, 8) + "...");
  sessionStorage.setItem("wastedb_access_token", token);
}
```

**After:**

```typescript
export function setAccessToken(token: string) {
  logger.log("setAccessToken called - storing authenticated token");
  sessionStorage.setItem("wastedb_access_token", token);
  logger.log("Token stored in sessionStorage successfully");
}
```

---

### Example 2: Authentication Check

**Before:**

```typescript
const token = getAccessToken();
console.log("Current token:", token);
if (token !== publicAnonKey) {
  console.log(
    "User is authenticated with token:",
    token.substring(0, 8) + "..."
  );
}
```

**After:**

```typescript
const token = getAccessToken();
const isAuth = token !== publicAnonKey;
logger.log("Authentication check:", isAuth ? "authenticated" : "anonymous");
if (isAuth) {
  logger.log("User is authenticated");
}
```

---

### Example 3: API Response

**Before:**

```typescript
const response = await apiCall("/auth/signin", {
  body: JSON.stringify({ email, password }),
});
console.log("Sign in response:", response);
// Logs: { access_token: "eyJhbGc...", user: { ... } }
```

**After:**

```typescript
const response = await apiCall("/auth/signin", {
  body: JSON.stringify({ email, password }),
});
logger.log("Sign in successful:", {
  userId: response.user.id,
  email: response.user.email,
  hasToken: !!response.access_token,
});
// Logs: { userId: "123", email: "user@example.com", hasToken: true }
```

---

## Summary Statistics

### API Security Migration (October 23, 2025)

**Token Logging Removed:**

- ❌ 5 instances of `token.substring(0, 8)` removed
- ❌ 3 instances of direct token logging removed
- ❌ 2 instances of token comparison logging removed

**Replaced With:**

- ✅ Boolean authentication state logging
- ✅ Authentication type logging (`anonymous` vs `authenticated`)
- ✅ Operation success/failure logging
- ✅ Structured error logging (without sensitive data)

**Result:**

- 🔒 Zero token data exposed in logs
- 🐛 Errors still logged for debugging
- Authentication state still trackable
- Performance unchanged (logger overhead = 0 when suppressed)

---

## Related Documentation

- [Logger Usage Guide](/docs/LOGGER_USAGE_GUIDE.md)
- [Logger Migration Examples](/docs/LOGGER_MIGRATION_EXAMPLE.md)
- [Security Guide](/docs/SECURITY.md)
- [API Documentation](/utils/api.tsx)

---

## Compliance Notes

This secure logging approach helps with:

- **GDPR Compliance:** No unnecessary PII logging
- **PCI DSS Compliance:** No payment data in logs
- **SOC 2 Compliance:** Audit trail without sensitive data exposure
- **HIPAA Compliance:** No health data in logs (if applicable)

---

**Last Updated:** October 23, 2025  
**Status:** Critical security guidelines enforced  
**Review Frequency:** Quarterly or when security incidents occur

---

## Contact

**Security Concerns:** Report immediately to security team  
**Questions:** See [Security Guide](/docs/SECURITY.md)  
**Code Review:** Use checklist above before merging
