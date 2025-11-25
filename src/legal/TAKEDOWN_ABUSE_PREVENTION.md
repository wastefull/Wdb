# DMCA Takedown Request - Abuse Prevention System

**Last Updated:** November 12, 2025  
**Version:** 1.0  
**System Owner:** Compliance Team (compliance@wastefull.org)

## Overview

WasteDB implements a comprehensive multi-layered abuse prevention system to protect against malicious, fraudulent, or spam DMCA takedown requests while maintaining accessibility for legitimate copyright holders.

---

## Protection Layers

### 1. **Rate Limiting**

#### IP-Based Rate Limiting

- **Limit:** 2 requests per 24 hours per IP address
- **Purpose:** Prevents automated bot attacks and DoS attempts
- **Implementation:** Combines IP address + User-Agent hash for client identification
- **Response:** HTTP 429 with `retryAfter` seconds

#### Email-Based Throttling

- **Limit:** 1 request per 7 days per email address
- **Purpose:** Prevents individual abuse and spam from single accounts
- **Override:** Contact legal@wastefull.org for legitimate urgent cases
- **Response:** HTTP 429 with hours remaining until next allowed submission

### 2. **Bot Detection**

#### Honeypot Field

- Hidden form field named "website" (not visible to legitimate users)
- Positioned off-screen using CSS
- Legitimate users cannot see or interact with it
- If filled, request is automatically rejected with 3-second delay
- **Result:** Blocks automated form submission tools

### 3. **Input Validation**

#### Required Field Validation

All required fields must be present and non-empty:

- Full name
- Email address
- Work title
- Relationship to copyright
- WasteDB URL of infringing content
- Content description
- Electronic signature

#### Email Validation

- Standard RFC-compliant email format
- Maximum length: 254 characters
- Blocks suspicious patterns (e.g., "..", multiple "+" signs)
- Flags temporary/disposable email domains

#### Content Quality Requirements

- **Work title:** Minimum 3 characters
- **Content description:** Minimum 50 characters (ensures detailed explanation)
- **Signature:** Must exactly match full name (case-insensitive)

### 4. **Duplicate Detection**

Checks for duplicate submissions using:

- Same email address + same WasteDB URL
- Within 30-day window
- **Response:** HTTP 409 with reference to existing request ID

### 5. **Suspicious Pattern Detection**

Requests are automatically flagged for admin review based on:

| Flag                      | Trigger Condition                                                    | Severity |
| ------------------------- | -------------------------------------------------------------------- | -------- |
| `name_too_short`          | Full name < 5 characters                                             | Medium   |
| `suspicious_email_domain` | Disposable email service (guerrillamail, tempmail, mailinator, etc.) | High     |
| `excessive_caps`          | >50% uppercase letters in description                                | Medium   |
| `generic_work_title`      | Contains "test", "sample", "example", "asdf", "qwerty"               | Medium   |

**Auto-Flagging Threshold:** 2+ flags triggers automatic admin review flag

### 6. **Legal Compliance Requirements**

All three legal attestations must be checked:

1. Good faith belief that use is unauthorized
2. Accuracy statement and authorization to act
3. Acknowledgment of 17 U.S.C. § 512(f) liability for false claims

**Legal Deterrent:** Perjury and damages liability under DMCA § 512(f)

---

## Admin Monitoring

### Automated Email Notifications

Every submission sends real-time alert to compliance@wastefull.org with:

- Request ID and timestamp
- 72-hour response deadline
- Complete submission details
- **Abuse detection alerts** (when flagged)
- Submitter IP address
- Suspicious flags enumerated
- Recommended action level

### Flagged Request Metadata

Stored in database for each request:

```typescript
{
  suspiciousFlags: string[] | null,
  flaggedForReview: boolean,  // true if ≥2 flags
  submitterIp: string,
  // ... other request data
}
```

### Admin Dashboard Integration

- Flagged requests visible in admin panel
- Sort/filter by suspicious flags
- IP address tracking for repeat offenders
- Historical submission patterns per email

---

## Response Workflow

### Legitimate Request (No Flags)

1. ✅ Passes all validation
2. ✅ Stored in database
3. ✅ Email sent to compliance team
4. ⏱️ 72-hour review timer starts
5. 👤 Admin reviews and processes

### Suspicious Request (Flagged)

1. ⚠️ Passes validation but triggers flags
2. ⚠️ Stored with `flaggedForReview: true`
3. ⚠️ Email sent with **ABUSE DETECTION ALERT** banner
4. Admin performs enhanced due diligence
5. 👤 Manual verification before processing

### Malicious Request (Blocked)

1. ❌ Fails validation (honeypot, rate limit, duplicate, etc.)
2. ❌ Not stored in database
3. ❌ No email sent
4. 📝 Logged with timestamp and reason
5. ⏱️ Bot subjected to delayed response (3 seconds)

---

## Bypass & Override Procedures

### Legitimate Urgent Cases

If a copyright holder needs to submit multiple legitimate requests:

**Option 1: Email Direct Contact**

- Email: legal@wastefull.org or compliance@wastefull.org
- Subject: "Urgent DMCA Request - [Description]"
- Attach evidence and complete DMCA notice manually

**Option 2: Admin Override**

- Admin can manually create takedown requests in database
- Bypasses all rate limiting
- Requires admin authentication

### False Positive Handling

If legitimate request is auto-flagged:

1. Request still processed (flags don't auto-reject)
2. Admin reviews with context of flags
3. Admin can whitelist email/IP for future submissions
4. Resolution documented in `reviewNotes` field

---

## Metrics & Monitoring

### Key Performance Indicators

- **Submission rate:** Requests per day/week
- **Flag rate:** Percentage of flagged requests
- **Block rate:** Percentage blocked at validation
- **False positive rate:** Flagged requests that were legitimate
- **Response time:** Average time to first admin review

### Logging

All events logged to console with prefixes:

- `✅` Successful submission
- `⚠️` Flagged submission (with flags listed)
- `❌` Blocked submission (with reason)
- `` Admin review action

---

## Security Considerations

### Privacy

- Submitter IP addresses stored for abuse prevention only
- Not shared publicly or with third parties
- Retained for duration of request + 1 year
- Compliant with privacy regulations

### DMCA § 512(f) Compliance

Our abuse prevention system maintains compliance with DMCA requirements:

- Does not unreasonably burden legitimate copyright holders
- Provides alternative contact methods for urgent/bulk requests
- Flags rather than auto-rejects questionable submissions
- Maintains documented review process

### Data Retention

- Takedown requests: Indefinite (legal compliance)
- Rate limit tracking: 24-48 hours
- Email throttle tracking: 7 days
- Flagged request metadata: Indefinite

---

## System Maintenance

### Regular Review Procedures

**Weekly:**

- Review flagged requests for pattern analysis
- Update suspicious email domain list
- Check for false positive trends

**Monthly:**

- Audit block/flag rates
- Review rate limiting effectiveness
- Update detection patterns as needed

**Quarterly:**

- Comprehensive abuse pattern analysis
- System effectiveness review
- Policy updates if needed

### Emergency Procedures

**If Under Attack:**

1. Temporarily reduce rate limits (e.g., 1 request/day)
2. Enable manual approval for all requests
3. Add attacker IPs to blocklist
4. Notify legal team for potential legal action

**Blocklist Management:**
If abuse from specific IP/email:

- Add to permanent blocklist in KV store
- Returns HTTP 403 Forbidden
- Logged with reason and timestamp
- Reviewed quarterly for removal consideration

---

## Contact Information

**For Technical Issues:**

- Email: natalie@wastefull.org
- Subject: "Takedown System Issue"

**For Legal/Compliance Questions:**

- Email: legal@wastefull.org
- Email: compliance@wastefull.org
- Response time: 24-72 hours

**For Urgent Matters:**

- Email: info@wastefull.org (monitored 24/7)

---

## Revision History

| Version | Date       | Changes                      | Author                   |
| ------- | ---------- | ---------------------------- | ------------------------ |
| 1.0     | 2025-11-12 | Initial system documentation | WasteDB Engineering Team |

---

**Document Status:** Active  
**Review Frequency:** Quarterly  
**Next Review:** 2026-02-12
