# Testing Email Confirmation - Correct Methods

## ⚠️ Important Note

**There is NO "Send Test Email" button in Supabase for email confirmation.**

The correct way to test is to actually sign up a test user or use the API.

---

## Method 1: Test via App UI (Recommended)

### Step-by-Step

```
1. Open your WasteDB app in browser
   ↓
2. Click "Sign Up" button
   ↓
3. Enter test credentials:
   Email: yourtest@gmail.com (use real email you can access)
   Password: TestPassword123!
   Name: Test User
   ↓
4. Click "Sign Up" / Submit
   ↓
5. You should see: "Please check your email to confirm your account"
   ↓
6. Check your email inbox
   ↓
7. Look for email from: noreply@wastefull.org
   Subject: "Confirm Your Email" or similar
   ↓
8. Click the confirmation link in the email
   ↓
9. You'll be redirected to: https://db.wastefull.org
   ↓
10. Now try to sign in with your test credentials
   ↓
11. ✅ Success! You're signed in
```

---

## Method 2: Test via API/Command Line

### Using cURL

**1. Sign Up (Create Account)**

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/make-server-17cae920/auth/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "message": "Account created. Please check your email to confirm your account."
}
```

**2. Check Your Email**
- Open the email from noreply@wastefull.org
- Click the confirmation link

**3. Try to Sign In (Before Confirming)**

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/make-server-17cae920/auth/signin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response (BEFORE confirmation):**
```json
{
  "error": "Email not confirmed"
}
```
Status: 403

**4. Try to Sign In (After Clicking Confirmation Link)**

```bash
# Same command as above
```

**Expected Response (AFTER confirmation):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    ...
  }
}
```
Status: 200

---

## Method 3: Monitor Resend Dashboard

### Real-Time Email Tracking

```
1. Go to: https://resend.com/emails
   ↓
2. This shows ALL emails sent via your API key
   ↓
3. After signup, you should immediately see:
   - To: test@example.com
   - Subject: "Confirm Your Email"
   - Status: "Delivered" or "Sent"
   ↓
4. Click the email to see:
   - Delivery time
   - Open status (if tracking enabled)
   - Full email content
   - Any errors
```

**What to look for:**
- ✅ Status: "Delivered" = Email sent successfully
- ⏳ Status: "Sent" = Still being delivered
- ❌ Status: "Bounced" or "Failed" = Problem

---

## Method 4: Check Supabase Logs

### View Auth Events

```
1. Go to: Supabase Dashboard
   ↓
2. Click "Logs" in left sidebar
   ↓
3. Select: "Auth Logs"
   ↓
4. Look for events:
   - Event: "user.signup"
   - Email: test@example.com
   - Status: Check for errors
```

**What to check:**
- Signup event logged?
- Any error messages?
- Email confirmation token generated?

---

## Verification Checklist

After testing, verify these all work:

### ✅ Email Delivery
- [ ] Email received in inbox (not spam)
- [ ] Email arrives within 30 seconds
- [ ] Sender shows as: noreply@wastefull.org
- [ ] Email contains confirmation link
- [ ] Link format: `https://[project].supabase.co/auth/v1/verify?token=...`

### ✅ Email Content
- [ ] Subject line is clear
- [ ] Email is professionally formatted
- [ ] Confirmation button/link works
- [ ] Plain text fallback included
- [ ] WasteDB branding present (optional)

### ✅ Confirmation Flow
- [ ] Clicking link redirects to site
- [ ] User can sign in after confirmation
- [ ] User CANNOT sign in before confirmation
- [ ] Error message is clear if unconfirmed

### ✅ Dashboard Checks
- [ ] Resend shows "Delivered" status
- [ ] Supabase logs show successful signup
- [ ] No errors in either dashboard

---

## Troubleshooting Test Issues

### Issue: No Email Received

**Checklist:**
```
□ Check spam/junk folder
□ Verify email address is correct
□ Check Resend dashboard - was it sent?
□ Check SMTP settings are saved
□ Verify SMTP credentials are correct
□ Try different email provider (Gmail, Outlook, etc.)
```

**Debug Steps:**

1. **Check Resend Dashboard**
   ```
   Go to: https://resend.com/emails
   Do you see the email?
   
   YES → Click it. What's the status?
         - Delivered: Check spam folder
         - Bounced: Invalid email address
         - Failed: SMTP issue
   
   NO → Email was never sent
        Check Supabase Auth logs
   ```

2. **Check Supabase Logs**
   ```
   Dashboard > Logs > Auth Logs
   Search for: user.signup
   
   Found? → Check for error messages
   Not found? → Signup didn't trigger properly
   ```

3. **Verify SMTP Settings**
   ```
   Dashboard > Project Settings > Auth > SMTP Settings
   
   Check:
   - Enable Custom SMTP: ON ☑
   - SMTP Host: smtp.resend.com ✓
   - SMTP Port: 587 ✓
   - SMTP User: resend ✓
   - SMTP Password: starts with re_ ✓
   ```

### Issue: Email Goes to Spam

**Solutions:**

1. **Verify Domain in Resend**
   ```
   Go to: https://resend.com/domains
   Check: wastefull.org has green checkmark ✓
   
   If not verified:
   - Add DNS records (SPF, DKIM)
   - Wait 5-10 minutes
   - Click "Verify"
   ```

2. **Check Email Content**
   - Avoid spam trigger words
   - Include plain text version
   - Use verified sender domain

3. **Whitelist Sender**
   - Add noreply@wastefull.org to contacts
   - Mark as "Not Spam" if it goes there

### Issue: Confirmation Link Doesn't Work

**Checklist:**
```
□ Site URL matches actual domain
□ Redirect URLs include the domain
□ Token hasn't expired (24hr default)
□ Browser isn't blocking redirect
```

**Fix:**
```
1. Go to: Dashboard > Project Settings > Auth
2. Scroll to: URL Configuration
3. Verify:
   Site URL: https://db.wastefull.org
   Redirect URLs:
     - https://db.wastefull.org
     - http://localhost:3000
4. Save
5. Try signup again with new test email
```

### Issue: Can Sign In Without Confirming

**This means email confirmation is not enabled!**

```
1. Go to: Dashboard > Authentication > Providers > Email
2. Check: "Confirm email" toggle is ON ☑
3. Save
4. Create new test account
5. Try to sign in before confirming
6. Should get error: "Email not confirmed"
```

---

## Testing Different Email Providers

Test with multiple email providers to ensure compatibility:

### Recommended Test Matrix

| Provider | Test Email | Expected Result |
|----------|------------|-----------------|
| Gmail | test@gmail.com | ✅ Inbox |
| Outlook | test@outlook.com | ✅ Inbox |
| Yahoo | test@yahoo.com | ✅ Inbox |
| ProtonMail | test@proton.me | ✅ Inbox |
| Custom Domain | test@yourdomain.com | ✅ Inbox |

**How to test:**
```
1. Sign up with Gmail address
2. Confirm it works (inbox, not spam)
3. Sign up with Outlook address
4. Confirm it works
5. Repeat for other providers
```

**Common issues:**
- Gmail: Usually works fine
- Outlook/Hotmail: Sometimes strict spam filters
- Yahoo: Can be slow (5-10 min delay)
- Custom domains: Check SPF/DKIM alignment

---

## Testing Email Content

### View Email Source

**In Gmail:**
```
1. Open the confirmation email
2. Click "More" (three dots)
3. Click "Show original"
4. Check:
   - SPF: PASS ✓
   - DKIM: PASS ✓
   - DMARC: PASS ✓
```

**Why this matters:**
- These authentication checks prevent spam
- All should show PASS
- If any FAIL, emails may go to spam

### Test Email Rendering

**Different Email Clients:**
```
1. Test in Gmail web
2. Test in Outlook web
3. Test in mobile (iPhone Mail, Android Gmail)
4. Test in desktop clients (Outlook, Apple Mail)
```

**What to check:**
- Images load properly
- Links are clickable
- Button formatting correct
- Text readable on all screen sizes

---

## Production Testing Checklist

Before going live:

### Pre-Production
- [ ] Test with at least 3 different email providers
- [ ] Verify emails go to inbox (not spam)
- [ ] Test on mobile and desktop
- [ ] Check confirmation link works
- [ ] Verify redirect URLs correct

### During Production Launch
- [ ] Monitor Resend dashboard for first hour
- [ ] Check delivery rate (should be >95%)
- [ ] Watch for bounce rate (should be <5%)
- [ ] Monitor Supabase Auth logs for errors

### Post-Production
- [ ] Send test signup once per day for first week
- [ ] Monitor user feedback
- [ ] Check spam reports in Resend
- [ ] Adjust email content if needed

---

## Advanced Testing

### Test Rate Limiting

**Resend Free Tier Limits:**
- 100 emails per day
- 3,000 emails per month

**Test:**
```
1. Sign up 5 test accounts rapidly
2. Check all emails arrive
3. Monitor Resend dashboard for rate limit warnings
```

### Test Token Expiration

**Default: 24 hours**

**Test:**
```
1. Sign up test account
2. DON'T click confirmation link
3. Wait 25 hours
4. Try to click link
5. Should show: "Token expired" or similar
6. User must request new confirmation email
```

### Test Email Template Variables

**Available variables:**
- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Token }}` - Raw token
- `{{ .Email }}` - User's email
- `{{ .SiteURL }}` - Your site URL

**Test each variable:**
```
1. Customize email template to include all variables
2. Sign up test account
3. Check email shows all variables correctly
4. No {{ }} syntax visible in final email
```

---

## Quick Test Commands Reference

### Create Test User
```bash
# Replace with your actual values
curl -X POST https://[PROJECT-ID].supabase.co/functions/v1/make-server-17cae920/auth/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON-KEY]" \
  -d '{"email":"test@gmail.com","password":"Test123!","name":"Test"}'
```

### Check User in Database
```sql
SELECT 
  email, 
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'Unconfirmed ❌'
    ELSE 'Confirmed ✅'
  END as status,
  created_at
FROM auth.users
WHERE email = 'test@gmail.com';
```

### Manually Confirm User (Emergency)
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'test@gmail.com';
```

### Check Recent Signups
```sql
SELECT 
  email,
  created_at,
  email_confirmed_at,
  EXTRACT(MINUTE FROM (NOW() - created_at)) as minutes_ago
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
```

---

## Summary

**Correct Testing Method:**
1. ✅ Sign up via app or API
2. ✅ Check Resend dashboard
3. ✅ Check email inbox
4. ✅ Click confirmation link
5. ✅ Verify signin works

**Incorrect Method:**
❌ Looking for "Send Test Email" button (doesn't exist)

**Key Resources:**
- Resend Dashboard: https://resend.com/emails
- Supabase Auth Logs: Dashboard > Logs > Auth
- Your app signup: https://db.wastefull.org

---

**Need Help?** Contact natto@wastefull.org  
**Resend Support**: support@resend.com  
**Supabase Support**: https://supabase.com/support
