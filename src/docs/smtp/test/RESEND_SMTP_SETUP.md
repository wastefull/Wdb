# Resend SMTP Setup for WasteDB Email Confirmation

## Quick Setup (5 Minutes)

You already have Resend configured for magic links, so this is just connecting it to Supabase's email confirmation system.

---

## Step 1: Create a New Resend API Key for SMTP

### ⚠️ Important: Create a Separate API Key

**You CANNOT use your existing `RESEND_API_KEY`** because:
- Resend only shows API keys once at creation (security feature)
- Supabase encrypts Edge Function secrets with SHA256 (cannot retrieve)
- Best practice: separate keys for edge functions vs SMTP

### Create the New Key

1. **Go to Resend Dashboard**: https://resend.com/api-keys

2. **Click "Create API Key"**

3. **Configure the key:**
   ```
   Name: WasteDB-SMTP-Email-Confirmation
   
   Permission: Sending access
   (⚠️ NOT "Full access" - SMTP only needs to send emails)
   
   Domain: wastefull.org
   (Or select "All domains")
   ```

4. **Click "Create"**

5. **COPY THE KEY IMMEDIATELY**
   ```
   Format: re_AbCdEfGh1234567890...
   
   ⚠️ CRITICAL: You will ONLY see this key ONCE!
   Copy it now and paste it somewhere safe temporarily
   ```

6. **Keep this key ready** for Step 2.3 below

---

## Step 2: Configure Supabase Auth to Use Resend

### 2.1 Navigate to Auth Settings

1. Go to https://supabase.com/dashboard
2. Select your WasteDB project
3. Click **Authentication** in the left sidebar
4. Click **Providers** tab
5. Find and click **Email**

### 2.2 Enable Email Confirmation

In the Email provider settings:

```
☑ Enable Email Provider (should already be checked)
☑ Confirm email (CHECK THIS BOX)
```

Click **Save**

### 2.3 Configure Custom SMTP

1. Stay in the **Authentication** section
2. Click **Email Templates** in the left sidebar
3. At the top, you'll see **SMTP Settings** - click **Configure SMTP**

Or go directly to:
**Project Settings** > **Auth** > **SMTP Settings**

### 2.4 Enter Resend SMTP Credentials

Fill in the following fields:

```
Enable Custom SMTP: ☑ (toggle ON)

Sender name: WasteDB
Sender email: noreply@wastefull.org

SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend

SMTP Password: [Your RESEND_API_KEY]
  Example: re_123abc456def789...
```

**Important Notes:**
- ✅ SMTP User is literally the word `resend` (not your email)
- ✅ SMTP Password is your Resend API key (starts with `re_`)
- ✅ Use `noreply@wastefull.org` as the sender (you already verified this domain)
- ✅ Port 587 is for TLS (recommended)

Click **Save**

---

## Step 3: Configure Site URL

1. Still in **Project Settings** > **Auth**
2. Scroll to **URL Configuration** section
3. Set the following:

```
Site URL: https://db.wastefull.org

Additional Redirect URLs:
  https://db.wastefull.org
  http://localhost:3000
  http://localhost:5173
```

Click **Save**

---

## Step 4: Customize Email Template (Optional)

1. Go to **Authentication** > **Email Templates**
2. Select **Confirm signup** from the dropdown
3. You'll see the default template

### Default Template
The default template works fine, but you can customize it:

**Subject:**
```
Confirm Your Email
```

**Body (HTML):**
```html
<h2>Welcome to WasteDB!</h2>
<p>Click the link below to confirm your email address and start exploring sustainable materials data:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email Address</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p style="color: #666; font-size: 12px; margin-top: 20px;">
  If you didn't create an account with WasteDB, you can safely ignore this email.
</p>
```

**Available Variables:**
- `{{ .ConfirmationURL }}` - The confirmation link (required!)
- `{{ .Token }}` - Confirmation token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

Click **Save**

---

## Step 5: Test the Setup

### 5.1 Test Email Sending

Test by creating an actual user account:

1. Open your WasteDB application
2. Go to the Sign Up page
3. Enter a test email address (one you can access)
4. Create a password
5. Submit the form
6. Check your inbox (and spam folder)
7. You should receive the confirmation email within seconds

**Alternative: Check Resend Dashboard**
- Go to https://resend.com/emails
- You should see the email in the list immediately
- Click it to view delivery status and details

### 5.2 Test Full Signup Flow

**Via Browser:**
```
1. Open your WasteDB app
2. Click "Sign In" or "Sign Up"
3. Enter test credentials:
   Email: your.email@example.com
   Password: TestPass123!
4. Click "Sign Up"
5. Check your email for confirmation link
6. Click the link
7. Return to app and sign in
```

**Via API (if testing backend):**
```bash
# 1. Sign up
curl -X POST https://[your-project].supabase.co/functions/v1/make-server-17cae920/auth/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'

# 2. Check email and click confirmation link

# 3. Try to sign in
curl -X POST https://[your-project].supabase.co/functions/v1/make-server-17cae920/auth/signin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SUPABASE_ANON_KEY]" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

---

## Verification Checklist

After completing the setup, verify:

- [ ] SMTP Settings show "Custom SMTP Enabled"
- [ ] Test email received successfully
- [ ] Test email not in spam folder
- [ ] Email contains working confirmation link
- [ ] Clicking link redirects to your Site URL
- [ ] Full signup → confirm → signin flow works
- [ ] Unconfirmed users cannot sign in (403 error)
- [ ] Magic links still work (should bypass confirmation)

---

## Troubleshooting

### Issue: "Invalid API key" error

**Solution:**
- Verify your Resend API key is correct
- Make sure you copied the full key (starts with `re_`)
- Check for extra spaces before/after the key
- Generate a new API key at https://resend.com/api-keys

### Issue: Emails not being received

**Check:**
1. Spam/junk folder
2. Resend dashboard for delivery status: https://resend.com/emails
3. Supabase Auth logs: **Authentication** > **Logs**
4. Verify domain is verified in Resend

**Resend Email Logs:**
- Go to https://resend.com/emails
- You should see all sent emails
- Click on an email to see delivery status
- Check for bounces or errors

### Issue: "Email not verified" for sender domain

**Solution:**
If using `noreply@wastefull.org`:
1. Go to https://resend.com/domains
2. Verify `wastefull.org` is listed and verified ✓
3. If not verified, follow DNS verification steps

If you want to use a different domain:
1. Add your domain in Resend
2. Add required DNS records (SPF, DKIM, DMARC)
3. Wait for verification (usually 5-10 minutes)

### Issue: Emails going to spam

**Solutions:**
1. **Verify domain** - Use a verified domain, not a free email service
2. **Add SPF/DKIM** - Resend automatically configures this for verified domains
3. **Warm up domain** - Send a few test emails first
4. **Check content** - Avoid spam trigger words
5. **Test inbox placement** - Use mail-tester.com

### Issue: Confirmation link doesn't work

**Check:**
1. Site URL matches your actual domain
2. Redirect URLs include your domain
3. Token hasn't expired (default: 24 hours)
4. Browser isn't blocking the redirect

### Issue: Rate limiting

Resend limits:
- **Free tier**: 100 emails/day
- **Paid tier**: 50,000 emails/month+

If hitting limits:
- Upgrade Resend plan
- Or switch to another provider (SendGrid, AWS SES)

---

## Monitoring Email Delivery

### Resend Dashboard

Check delivery status:
```
1. Go to https://resend.com/emails
2. See all sent emails in real-time
3. Click email for detailed delivery info
4. Check bounce rate, open rate (if enabled)
```

### Supabase Logs

Monitor auth events:
```
1. Go to Authentication > Logs
2. Filter by "Email Sent"
3. Check for errors or failures
```

---

## Domain Verification (If Not Already Done)

If `wastefull.org` isn't verified in Resend:

### 1. Add Domain
```
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: wastefull.org
4. Click "Add"
```

### 2. Add DNS Records

Resend will show you DNS records to add. Example:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Records:**
```
Type: TXT
Name: resend._domainkey
Value: [provided by Resend]
```

Add these in your DNS provider (wherever you manage wastefull.org DNS).

### 3. Verify
```
1. Wait 5-10 minutes for DNS propagation
2. Click "Verify" in Resend dashboard
3. Should show green checkmark ✓
```

---

## Alternative: Use Supabase Default SMTP (Dev Only)

If you just want to test locally without configuring SMTP:

**Pros:**
- No configuration needed
- Works immediately

**Cons:**
- ⚠️ Only 3 emails per hour
- ⚠️ Often goes to spam
- ⚠️ Not reliable for production
- ⚠️ No custom sender email

**How to use:**
- Just skip SMTP configuration
- Leave "Enable Custom SMTP" toggled OFF
- Supabase will use their default sender

---

## Production Checklist

Before going live:

- [ ] Custom SMTP configured (Resend)
- [ ] Domain verified in Resend
- [ ] Sender email uses verified domain
- [ ] Site URL set to production domain
- [ ] Email templates reviewed and customized
- [ ] Test emails received in inbox (not spam)
- [ ] Full signup flow tested end-to-end
- [ ] Magic links tested
- [ ] Resend plan supports expected volume
- [ ] Email monitoring/logging enabled

---

## Quick Reference

**Resend SMTP Settings:**
```
Host: smtp.resend.com
Port: 587
User: resend
Pass: [Your Resend API Key]
```

**Sender Email:**
```
noreply@wastefull.org
(or any email from verified domain)
```

**Environment Variable:**
```
RESEND_API_KEY = re_xxxxxxxxxxxxx
(already configured in your project)
```

**Resend Dashboard URLs:**
- API Keys: https://resend.com/api-keys
- Domains: https://resend.com/domains
- Email Logs: https://resend.com/emails
- Docs: https://resend.com/docs

---

## Support

**Issues with Resend:**
- Docs: https://resend.com/docs
- Support: support@resend.com

**Issues with Supabase:**
- Docs: https://supabase.com/docs/guides/auth/auth-smtp
- Support: https://supabase.com/support

**Issues with WasteDB:**
- Contact: natto@wastefull.org
- See: EMAIL_CONFIRMATION_SETUP.md for detailed troubleshooting

---

**Status**: Ready to configure  
**Estimated Time**: 5 minutes  
**Difficulty**: Easy (you already have Resend configured)
