# Resend SMTP - 5-Minute Quick Guide

## What You Need

✅ **Resend API Key**: You already have this in `RESEND_API_KEY` environment variable  
✅ **Verified Domain**: `wastefull.org` (already verified for magic links)  
✅ **5 minutes**: That's all it takes!

---

## Step-by-Step Setup

### Step 1: Enable Email Confirmation (30 seconds)

```
📍 Location: Supabase Dashboard > Authentication > Providers > Email

1. Click "Email" provider
2. Check the box: ☑ "Confirm email"
3. Click "Save"
```

---

### Step 2: Configure SMTP (2 minutes)

```
📍 Location: Supabase Dashboard > Project Settings > Auth

Scroll to "SMTP Settings" section:

1. Toggle ON: "Enable Custom SMTP"

2. Fill in the form:
   ┌─────────────────────────────────────┐
   │ Sender name: WasteDB                │
   │ Sender email: noreply@wastefull.org │
   │                                     │
   │ SMTP Host: smtp.resend.com          │
   │ SMTP Port: 587                      │
   │ SMTP User: resend                   │
   │ SMTP Password: [Your API Key]       │
   └─────────────────────────────────────┘

3. Click "Save"
```

**Getting Your API Key:**

🔑 **IMPORTANT**: Create a NEW API key specifically for SMTP

Why? 
- You can't view existing keys in Resend (security feature)
- Supabase encrypts secrets (SHA256) - can't retrieve original
- Best practice: separate keys for different purposes

**Steps to create new API key:**
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name: `WasteDB-SMTP-Email-Confirmation`
4. Permission: **"Sending access"** (NOT "Full access")
5. Click "Create"
6. **COPY THE KEY NOW** (starts with `re_`) - you won't see it again!
7. Paste it into the SMTP Password field in Supabase

---

### Step 3: Set Site URL (1 minute)

```
📍 Location: Same page (Project Settings > Auth)

Scroll to "URL Configuration" section:

1. Site URL: https://db.wastefull.org

2. Redirect URLs (one per line):
   https://db.wastefull.org
   http://localhost:3000

3. Click "Save"
```

---

### Step 4: Test It (2 minutes)

**Test with actual signup:**

```
1. Open your WasteDB app
2. Click "Sign Up"
3. Enter a test email and password
4. Submit the form
5. Check your inbox (should arrive in seconds)
6. ✅ Email received = Success!

Alternative: Check Resend Dashboard
→ Go to https://resend.com/emails
→ You should see the email in the list
→ Click it to view delivery status
```

---

## That's It! 🎉

Your email confirmation system is now live.

### What Happens Now:

**When users sign up:**
1. They create account with email/password
2. Supabase sends confirmation email via Resend
3. They click the link in the email
4. They can now sign in

**If they try to sign in before confirming:**
- ❌ Error: "Please confirm your email address..."
- ✅ After clicking link: Sign in works!

---

## Quick Test Checklist

Test the full flow:

- [ ] Sign up with test email via app
- [ ] Check Resend dashboard (https://resend.com/emails)
- [ ] Receive confirmation email (check spam if needed)
- [ ] Click confirmation link
- [ ] Sign in successfully

**Note:** There is no "Send Test Email" button - you must actually sign up a test user.

---

## Troubleshooting

### "No email received"
→ Check spam folder  
→ Go to https://resend.com/emails to see if it was sent  
→ Verify domain is `wastefull.org` (already verified)

### "Invalid credentials" in SMTP settings
→ Double-check API key has no spaces  
→ Make sure SMTP User is exactly: `resend`  
→ Generate new API key at resend.com if needed

### "Email not verified" error
→ Domain `wastefull.org` should already be verified  
→ Check at https://resend.com/domains  
→ If not verified, add DNS records (see RESEND_SMTP_SETUP.md)

---

## Pro Tips

💡 **Monitor emails**: https://resend.com/emails shows all sent emails in real-time

💡 **Check deliverability**: Click any email in Resend dashboard to see if it was delivered/opened

💡 **Custom templates**: Edit in Authentication > Email Templates (optional)

💡 **Magic links**: These still work and bypass confirmation (clicking the link = verification)

---

## What You Just Configured

```
┌──────────────────────────────────────────┐
│                                          │
│  WasteDB App                             │
│       ↓                                  │
│  Supabase Auth                           │
│       ↓                                  │
│  SMTP (smtp.resend.com)                  │
│       ↓                                  │
│  Resend API                              │
│       ↓                                  │
│  User's Email Inbox ✉️                   │
│                                          │
└──────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ SMTP configured
2. ⏭️ Test with a real account
3. ⏭️ Customize email templates (optional)
4. ⏭️ Deploy to production

---

## Full Documentation

- **Detailed Setup**: `/RESEND_SMTP_SETUP.md`
- **Email Confirmation**: `/EMAIL_CONFIRMATION_SETUP.md`  
- **Quick Checklist**: `/EMAIL_SETUP_CHECKLIST.md`

---

**Questions?** Contact natto@wastefull.org  
**Resend Docs**: https://resend.com/docs/send-with-smtp  
**Supabase Docs**: https://supabase.com/docs/guides/auth/auth-smtp
