# Email Confirmation - Quick Setup Checklist

## 🚀 5-Minute Setup Guide

### Step 1: Enable Email Confirmation (2 min)
```
□ Go to Supabase Dashboard (https://supabase.com/dashboard)
□ Select your WasteDB project
□ Navigate to: Authentication > Providers > Email
□ Toggle ON: "Confirm email"
□ Click "Save"
```

### Step 2: Configure SMTP Settings (3 min)

**Option A: Use Resend (Recommended)**

👉 **See detailed guides**: 
- API Key Creation: `/RESEND_API_KEY_GUIDE.md`
- SMTP Setup: `/RESEND_SETUP_QUICK_GUIDE.md`

```
□ Create NEW Resend API key (see /RESEND_API_KEY_GUIDE.md)
  - Permission: "Sending access" (NOT "Full access")
  - Name: WasteDB-SMTP-Email-Confirmation
  - Copy key immediately (starts with re_)

□ Go to: Supabase > Project Settings > Auth > SMTP Settings
□ Enable Custom SMTP
□ Fill in:
  SMTP Host: smtp.resend.com
  SMTP Port: 587
  SMTP User: resend
  SMTP Pass: [Paste your NEW Resend API key]
  Sender email: noreply@wastefull.org
  Sender name: WasteDB
□ Click "Save"
```

⚠️ **Note**: You MUST create a NEW API key - can't reuse existing one (see guide for why)

**Option B: Use Supabase Default (Dev Only)**
```
□ Skip SMTP configuration
□ ⚠️ Limited to 3 emails/hour
□ ⚠️ Emails may go to spam
□ Only use for testing!
```

### Step 3: Set Site URL (1 min)
```
□ Go to: Authentication > URL Configuration
□ Set Site URL: https://[your-domain].com
□ Add to Redirect URLs:
  - https://[your-domain].com
  - http://localhost:3000 (for dev)
□ Click "Save"
```

### Step 4: Test (2 min)
```
□ Sign up with your real email
□ Check inbox (and spam folder)
□ Click confirmation link
□ Try to sign in
□ Should work! ✅
```

---

## ⚡ Quick Test Commands

**1. Sign Up**
```bash
# Create account
POST /auth/signup
{
  "email": "test@example.com",
  "password": "TestPass123!",
  "name": "Test User"
}

# Expected: Account created, check email message
```

**2. Try Sign In (Should Fail)**
```bash
POST /auth/signin
{
  "email": "test@example.com",
  "password": "TestPass123!"
}

# Expected: 403 - "Please confirm your email..."
```

**3. Click Email Link → Try Again (Should Work)**
```bash
# After clicking confirmation link
POST /auth/signin
{
  "email": "test@example.com",
  "password": "TestPass123!"
}

# Expected: 200 - Success with access_token
```

---

## 🆘 Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| No email received | Check spam folder, verify SMTP config |
| Link doesn't work | Check Site URL matches your domain |
| Still can't sign in | Check `email_confirmed_at` in database |
| Need to manually confirm | See SQL command below |

**Manual Confirmation SQL:**
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

---

## 📋 Pre-Flight Checklist

Before deploying to production:

- [ ] SMTP configured with real provider (not default)
- [ ] Site URL set to production domain
- [ ] Tested full signup → confirm → signin flow
- [ ] Tested with multiple email providers (Gmail, Outlook, etc.)
- [ ] Checked spam folder delivery
- [ ] Verified magic links still work
- [ ] Confirmed admin accounts work
- [ ] Email templates reviewed (optional)

---

## 🔗 Full Documentation

- **Complete Setup**: EMAIL_CONFIRMATION_SETUP.md
- **Implementation Details**: EMAIL_CONFIRMATION_SUMMARY.md
- **Email Logo Setup**: EMAIL_LOGO_SETUP.md

---

**Need Help?** Contact natto@wastefull.org

**Status**: ✅ Ready to Deploy (after SMTP configuration)
