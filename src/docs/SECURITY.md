# WasteDB Security Measures

This document outlines the comprehensive security measures implemented in WasteDB to protect against malicious actors, API abuse, DOS/DDOS attacks, and unauthorized access.

## 🆕 Environment-Aware Authentication (v1.2.0)

**Implemented:** October 23, 2025

WasteDB now uses **environment-aware authentication** that adapts based on deployment context:

### Production (Deployed):
- ✅ **Magic Link ONLY** - Passwordless authentication
- ✅ No password option visible
- ✅ Cleaner, more secure UX
- ✅ Follows industry best practices

### Figma Make (Testing):
- ✅ **Both Magic Link AND Password** available
- ✅ Fast testing workflow
- ✅ No email dependency for rapid iteration

**Benefits:**
- Reduced attack surface in production
- No password vulnerabilities (reuse, weak passwords, brute force)
- Better user experience with passwordless auth
- Flexible testing during development

**See:** `/docs/ENVIRONMENT_AUTH_STRATEGY.md` and `/docs/AUTH_UI_COMPARISON.md`

---

## Authentication Hardening (v1.1.0)

### 1. Rate Limiting

**Implementation:** Multi-tier rate limiting using IP + User-Agent fingerprinting

#### Rate Limit Tiers:
- **AUTH (Sign In):** 5 requests per minute per client
- **SIGNUP (Sign Up):** 3 requests per hour per IP
- **API (General):** 100 requests per minute per client

#### Features:
- Sliding window rate limiting
- Per-client tracking using IP + User-Agent hash
- Automatic cleanup of old request timestamps
- Custom retry-after headers in 429 responses
- Fail-open design (continues on rate limit errors to prevent service disruption)

**Storage:** Rate limit data stored in KV store with keys like `ratelimit:AUTH:192.168.1.1:12345`

---

### 2. Email Validation & Domain Protection

**Purpose:** Prevent email enumeration and protect @wastefull.org domain

#### Email Validation Rules:
1. **Format Validation:** Must match standard email format (user@domain.tld)
2. **Length Limits:** Maximum 254 characters (RFC 5321)
3. **Suspicious Pattern Detection:**
   - Prevents consecutive dots (..)
   - Limits excessive use of plus addressing (+)
4. **Domain Verification:**
   - Automatically grants admin role to @wastefull.org emails
   - All other valid emails get user role

#### Anti-Enumeration:
- Generic error messages ("Unable to create account" instead of "Email already exists")
- Same response time for existing and non-existing emails

---

### 3. Password Strength Requirements

**Minimum Requirements:**
- At least 8 characters (increased from 6)
- Maximum 128 characters
- Checks against common weak passwords:
  - password
  - 12345678
  - qwertyui
  - admin123
  - letmein1

**Future Enhancements:**
- Integration with Have I Been Pwned API for compromised password detection
- Complexity requirements (uppercase, lowercase, numbers, special chars)
- Password history to prevent reuse

---

### 4. Account Lockout Protection

**Failed Login Tracking:**
- Tracks failed login attempts per email address
- Lockout after 5 failed attempts within 15 minutes
- Automatic unlock after 15-minute cooldown period
- Clear failed attempts counter on successful login

**Storage:** Failed attempts stored in KV with keys like `failed_logins:user@example.com`

**Response:** User-friendly error messages with countdown timer

---

### 5. Honeypot Anti-Bot Protection

**Implementation:** Hidden form field that catches automated bots

#### How It Works:
1. Hidden input field added to sign-up and sign-in forms
2. Positioned absolutely off-screen (-9999px)
3. Has tabIndex={-1} and aria-hidden="true"
4. Legitimate users never interact with it
5. Bots typically auto-fill all fields

#### Response Strategy:
- **Sign Up:** Returns fake success to avoid alerting bots
- **Sign In:** Adds 2-second delay + generic error message

---

### 6. Signup Abuse Prevention

**Duplicate Prevention:**
- Tracks recent signups per IP address
- Prevents same email from being created multiple times from same location
- Stores up to 10 recent signup emails per client

**Storage:** `recent_signups:{clientId}` in KV store

---

### 7. User Metadata Tracking

**Signup Metadata Captured:**
- `isOrgEmail`: Boolean flag for @wastefull.org emails
- `signupIp`: IP address (first part of client ID)
- `signupTimestamp`: ISO 8601 timestamp of account creation

**Purpose:** Audit trail for security investigations and abuse detection

---

### 8. Client Identification

**Fingerprinting Method:**
- Combines IP address with hashed User-Agent
- Format: `{IP}:{UA_HASH}`
- Example: `192.168.1.1:42857`

**IP Extraction:**
- Reads `x-forwarded-for` header (for proxied requests)
- Falls back to connection IP
- Takes first IP in chain (client IP)

---

## Server-Side Security

### 1. Authentication Middleware

**verifyAuth:**
- Validates Bearer token on every protected route
- Checks token against Supabase auth
- Stores userId and userEmail in request context
- Returns 401 for invalid/missing tokens

**verifyAdmin:**
- Requires verifyAuth first
- Checks user role from KV store
- Auto-initializes natto@wastefull.org as admin
- Returns 403 for non-admin users

### 2. CORS Configuration

**Settings:**
- Origin: * (allows all origins)
- Headers: Content-Type, Authorization
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Max Age: 600 seconds

### 3. Request Logging

**Middleware:** Hono logger logs all requests to console

**Format:** Standard HTTP access log format with timestamps

---

## Frontend Security

### 1. Token Management

**Storage:** SessionStorage (not localStorage for better security)

**Functions:**
- `setAccessToken()`: Store JWT token
- `getAccessToken()`: Retrieve token (falls back to public anon key)
- `clearAccessToken()`: Remove token on logout
- `isAuthenticated()`: Check if user has valid token

**Auto-Cleanup:** Tokens cleared on 401 responses

### 2. Error Handling

**User-Friendly Messages:**
- Rate limit exceeded → "Too many attempts. Please wait a moment."
- Account locked → "Too many failed attempts. Account temporarily locked."
- Generic auth errors → "Invalid email or password" (prevents enumeration)

### 3. Security Indicators

**Visual Cues:**
- Shield icon on auth form
- "Protected by rate limiting" notice
- Password requirements displayed
- Clean UI without revealing admin access patterns (security by obscurity removed)

---

## API Security Best Practices

### ✅ Implemented:
- Rate limiting on all endpoints
- Email validation and sanitization
- Password strength requirements
- Account lockout after failed attempts
- Honeypot anti-bot protection
- Generic error messages (anti-enumeration)
- Request logging
- Token-based authentication
- Role-based access control (RBAC)
- User metadata tracking

### 🔄 Recommended Future Enhancements:
1. **CAPTCHA/reCAPTCHA** on signup/signin after failed attempts
2. **2FA/MFA** for admin accounts
3. **Email verification** when email server is configured
4. **Password reset** with secure token expiration
5. **Session management** with refresh tokens
6. **IP geolocation** blocking for unusual locations
7. **Device fingerprinting** for anomaly detection
8. **Audit logging** to database for compliance
9. **CSP headers** for XSS protection
10. **HTTPS-only cookies** when using cookie auth

---

## Security Incident Response

### If Rate Limits Are Bypassed:
1. Review client fingerprinting logic
2. Consider adding CAPTCHA challenges
3. Implement IP-based blocking lists
4. Reduce rate limit windows

### If Accounts Are Compromised:
1. Force password reset for affected users
2. Invalidate all active sessions
3. Review authentication logs
4. Enable 2FA for all admin accounts

### If DOS Attack Occurs:
1. CloudFlare/CDN protection recommended
2. Database connection pooling
3. Increase rate limits for legitimate traffic patterns
4. Implement request queuing

---

## Testing Security Measures

### Rate Limiting Test:
```bash
# Test auth rate limit (should block after 5 requests)
for i in {1..10}; do
  curl -X POST https://{project}.supabase.co/functions/v1/make-server-17cae920/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

### Honeypot Test:
```bash
# Should return fake success
curl -X POST https://{project}.supabase.co/functions/v1/make-server-17cae920/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"bot@example.com","password":"password","honeypot":"filled"}'
```

### Account Lockout Test:
```bash
# 5 failed attempts should trigger lockout
for i in {1..6}; do
  curl -X POST https://{project}.supabase.co/functions/v1/make-server-17cae920/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"real@example.com","password":"wrong'$i'"}'
done
```

---

## Compliance Notes

**GDPR Considerations:**
- User data (email, name) stored in Supabase with encryption at rest
- IP addresses hashed for rate limiting (not stored long-term)
- Users can request account deletion via admin

**CCPA Considerations:**
- Users have right to access their data
- Data minimization practiced (only essential fields stored)
- No third-party data sharing

**OWASP Top 10 Coverage:**
- ✅ A01:2021 – Broken Access Control → RBAC implemented
- ✅ A02:2021 – Cryptographic Failures → HTTPS + Supabase encryption
- ✅ A03:2021 – Injection → Parameterized queries via Supabase SDK
- ✅ A04:2021 – Insecure Design → Rate limiting + validation
- ✅ A05:2021 – Security Misconfiguration → Secure defaults
- ✅ A07:2021 – Identification and Authentication Failures → Strong auth + lockout
- ⚠️ A08:2021 – Software and Data Integrity Failures → Consider code signing
- ⚠️ A09:2021 – Security Logging → Basic logging (enhance for production)
- ✅ A10:2021 – Server-Side Request Forgery → No external requests from user input

---

## Version History

- **v1.1.0** (2025-01-20) - Hardened authentication with rate limiting, email validation, password requirements, account lockout, and honeypot protection
- **v1.0.2** - Basic authentication with Supabase
- **v1.0.0** - Initial release

---

## Contact

For security concerns or vulnerability reports:
- Email: natto@wastefull.org
- Please do not publicly disclose vulnerabilities before coordinated disclosure
