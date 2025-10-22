# SMTP Configuration Values - Copy & Paste Reference

Use these exact values when configuring Supabase SMTP settings.

---

## 📋 Supabase SMTP Settings

**Location**: Supabase Dashboard > Project Settings > Auth > SMTP Settings

### Configuration Form

```
Enable Custom SMTP: ON ☑

─────────────────────────────────────────
Sender Information
─────────────────────────────────────────

Sender name:
WasteDB

Sender email:
noreply@wastefull.org

─────────────────────────────────────────
SMTP Server Settings
─────────────────────────────────────────

SMTP Host:
smtp.resend.com

SMTP Port:
587

SMTP User:
resend

SMTP Password:
[YOUR_RESEND_API_KEY]
(Starts with re_ - get from RESEND_API_KEY env var)

─────────────────────────────────────────
```

---

## 🌐 URL Configuration

**Location**: Supabase Dashboard > Project Settings > Auth > URL Configuration

### Site URL
```
https://db.wastefull.org
```

### Additional Redirect URLs
```
https://db.wastefull.org
http://localhost:3000
http://localhost:5173
```

---

## ✉️ Email Provider Settings

**Location**: Supabase Dashboard > Authentication > Providers > Email

### Settings
```
☑ Enable Email Provider
☑ Confirm email
☐ Secure email change (optional)
```

---

## 📧 Email Template (Optional Customization)

**Location**: Supabase Dashboard > Authentication > Email Templates

### Subject
```
Confirm Your WasteDB Account
```

### Email Body (HTML)
```html
<h2 style="color: #2c5f2d;">Welcome to WasteDB!</h2>

<p>Thank you for creating an account. Click the button below to confirm your email address and start exploring sustainable materials data:</p>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #2c5f2d; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px;
            display: inline-block;
            font-weight: bold;">
    Confirm Email Address
  </a>
</div>

<p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
<p style="color: #666; font-size: 12px; word-break: break-all;">{{ .ConfirmationURL }}</p>

<hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">

<p style="color: #999; font-size: 12px;">
  If you didn't create an account with WasteDB, you can safely ignore this email.
</p>

<p style="color: #999; font-size: 12px;">
  This is an automated email from WasteDB - Open Materials Sustainability Database
</p>
```

---

## 🔑 Creating a New Resend API Key for SMTP

### ⚠️ Important: You MUST Create a New Key

**Why you can't use the existing key:**
- ✅ Resend only shows API keys once at creation (security)
- ✅ Supabase encrypts secrets with SHA256 (can't retrieve original)
- ✅ Best practice: separate keys for edge functions vs SMTP

### Step-by-Step: Create New API Key

**1. Go to Resend Dashboard**
```
https://resend.com/api-keys
```

**2. Click "Create API Key" button**

**3. Fill in the form:**
```
Name: WasteDB-SMTP-Email-Confirmation

Permission: Sending access ⚡
(NOT "Full access" - only needs to send emails)

Domain: wastefull.org
(Or "All domains" if you want flexibility)
```

**4. Click "Create"**

**5. COPY THE KEY IMMEDIATELY**
```
The key will look like: re_AbCdEfGh1234567890...

⚠️ IMPORTANT: Copy it NOW - you won't see it again!
```

**6. Paste into Supabase SMTP Settings**
```
SMTP Password: [paste the key you just copied]
```

### Security Best Practices

✅ **DO:**
- Create separate API keys for different purposes
- Use "Sending access" permission for SMTP
- Store keys securely (Supabase encrypts them)
- Name keys descriptively (e.g., "SMTP-Email-Confirmation")

❌ **DON'T:**
- Use "Full access" unless absolutely necessary
- Share API keys between services
- Store keys in plain text files
- Commit keys to version control

---

## ✅ Verification After Setup

### Test SMTP Connection

**Method: Create a test account**

1. Open your WasteDB application
2. Click "Sign Up"
3. Enter a test email you can access
4. Create a password and submit
5. Check your inbox (should arrive within seconds)
6. ✅ Success if received!

### Check Resend Delivery

1. Go to: https://resend.com/emails
2. You should see the confirmation email in the list
3. Click it to view delivery details
4. Status should be "Delivered" ✓

### Alternative: Check Supabase Logs

1. Go to: Supabase Dashboard > Logs
2. Select "Auth Logs"
3. Look for "user.signup" event
4. Should show successful email sending

---

## 📊 Quick Reference Table

| Setting | Value |
|---------|-------|
| **SMTP Host** | `smtp.resend.com` |
| **SMTP Port** | `587` |
| **SMTP User** | `resend` |
| **SMTP Pass** | `[Your Resend API Key]` |
| **Sender Email** | `noreply@wastefull.org` |
| **Sender Name** | `WasteDB` |
| **Site URL** | `https://db.wastefull.org` |
| **TLS/SSL** | Enabled (automatic on port 587) |

---

## 🚨 Common Mistakes to Avoid

❌ **Wrong SMTP User**
- WRONG: `noreply@wastefull.org`
- WRONG: `your.email@example.com`
- ✅ CORRECT: `resend`

❌ **Wrong Port**
- WRONG: `465` (SSL port - not supported by Resend)
- WRONG: `25` (Standard SMTP - blocked by most cloud providers)
- ✅ CORRECT: `587`

❌ **Unverified Sender Domain**
- WRONG: `noreply@gmail.com`
- WRONG: `test@example.com`
- ✅ CORRECT: `noreply@wastefull.org` (verified domain)

❌ **API Key with Spaces**
- WRONG: ` re_abc123... ` (spaces before/after)
- ✅ CORRECT: `re_abc123...` (no spaces)

---

## 🔍 Troubleshooting Commands

### Test SMTP Connection (CLI)
```bash
# Using swaks (SMTP test tool)
swaks --to test@example.com \
      --from noreply@wastefull.org \
      --server smtp.resend.com:587 \
      --auth LOGIN \
      --auth-user resend \
      --auth-password "YOUR_API_KEY" \
      --tls
```

### Check DNS Records
```bash
# Verify SPF record
dig TXT wastefull.org +short | grep spf

# Verify DKIM
dig TXT resend._domainkey.wastefull.org +short
```

### Query Supabase for Unconfirmed Users
```sql
-- Run in Supabase SQL Editor
SELECT 
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'Unconfirmed ❌'
    ELSE 'Confirmed ✅'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;
```

---

## 📖 Related Documentation

- **Quick Setup**: `/RESEND_SETUP_QUICK_GUIDE.md`
- **Full Setup**: `/RESEND_SMTP_SETUP.md`
- **Email Confirmation**: `/EMAIL_CONFIRMATION_SETUP.md`
- **Checklist**: `/EMAIL_SETUP_CHECKLIST.md`

---

## 🆘 Need Help?

**Resend Issues:**
- Dashboard: https://resend.com/emails
- Docs: https://resend.com/docs/send-with-smtp
- Support: support@resend.com

**Supabase Issues:**
- Docs: https://supabase.com/docs/guides/auth/auth-smtp
- Logs: Dashboard > Authentication > Logs
- Community: https://supabase.com/discord

**WasteDB Issues:**
- Contact: natto@wastefull.org

---

**Last Updated**: October 22, 2025  
**Version**: 1.0  
**Status**: Ready to Use
