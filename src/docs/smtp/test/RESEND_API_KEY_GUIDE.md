# Creating a Resend API Key for SMTP - Step-by-Step

## Why Create a New API Key?

You asked great questions! Here are the answers:

### Q: Should I generate a new API key?
✅ **YES** - Create a separate key for SMTP email confirmation

### Q: I can't copy the existing API key from Resend?
✅ **CORRECT** - Resend only shows keys once at creation (security feature)

### Q: Edge Function Secrets are SHA256 encrypted?
✅ **YES** - Supabase encrypts all secrets, so you can't retrieve the original value

### Q: Full access vs Sending access?
✅ **Use "Sending access"** - SMTP only needs to send emails, not manage your account

---

## Step-by-Step: Create New API Key

### Step 1: Navigate to Resend

```
1. Open your browser
2. Go to: https://resend.com/api-keys
3. Log in if needed
```

---

### Step 2: Create New Key

```
┌─────────────────────────────────────────────┐
│  Resend Dashboard > API Keys                │
│                                             │
│  [Create API Key] ← Click this button       │
└─────────────────────────────────────────────┘
```

---

### Step 3: Configure the Key

You'll see a form with these fields:

```
┌─────────────────────────────────────────────┐
│  Create API Key                             │
├─────────────────────────────────────────────┤
│                                             │
│  Name *                                     │
│  ┌───────────────────────────────────────┐ │
│  │ WasteDB-SMTP-Email-Confirmation       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Permission *                               │
│  ( ) Full access                            │
│  (•) Sending access  ← SELECT THIS          │
│                                             │
│  Domain (optional)                          │
│  ┌───────────────────────────────────────┐ │
│  │ wastefull.org                         │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [Cancel]  [Create] ← Click when ready     │
│                                             │
└─────────────────────────────────────────────┘
```

**Fill in exactly:**
- **Name**: `WasteDB-SMTP-Email-Confirmation`
- **Permission**: `Sending access` ⚡ (NOT Full access)
- **Domain**: `wastefull.org` (or leave blank for all domains)

---

### Step 4: Copy the API Key

**⚠️ CRITICAL: This is your ONLY chance to copy the key!**

After clicking "Create", you'll see:

```
┌─────────────────────────────────────────────┐
│  ✓ API Key Created                          │
├─────────────────────────────────────────────┤
│                                             │
│  re_AbCdEfGh1234567890aBcDeFgHiJkLmNo...   │
│                                             │
│  [Copy to Clipboard] ← Click this           │
│                                             │
│  ⚠️ Make sure to copy your API key now.     │
│     You won't be able to see it again!      │
│                                             │
└─────────────────────────────────────────────┘
```

**Actions:**
1. Click "Copy to Clipboard"
2. Paste it somewhere safe temporarily (Notes app, text file)
3. You'll use this in Supabase SMTP settings

**Format check:**
- ✅ Starts with `re_`
- ✅ Long string of letters and numbers
- ✅ No spaces before or after

---

### Step 5: Verify Key Creation

Back on the API Keys page, you should see:

```
┌─────────────────────────────────────────────────────────┐
│  Your API Keys                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Name                          Permission    Created    │
│  ───────────────────────────────────────────────────   │
│  WasteDB-SMTP-Email-Confirmation  Sending    Just now  │
│  re_AbCd**********************                          │
│                                                         │
│  [Your other keys...]                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

✅ **Success!** Your key is created

---

## What to Do With the Key

### Next: Configure Supabase SMTP

Now that you have your API key, go to Supabase:

```
1. Supabase Dashboard
   ↓
2. Project Settings > Auth > SMTP Settings
   ↓
3. Paste the key into "SMTP Password" field
   ↓
4. Save
```

**Full instructions**: See `/RESEND_SETUP_QUICK_GUIDE.md`

---

## Permission Comparison

### "Sending access" ✅ (Use This)

**Can:**
- ✅ Send emails via SMTP
- ✅ Send emails via API
- ✅ View email logs

**Cannot:**
- ❌ Manage API keys
- ❌ Manage domains
- ❌ Access billing
- ❌ Delete account

**Best for:** SMTP, email confirmation, automated emails

---

### "Full access" ⚠️ (Don't Use for SMTP)

**Can:**
- ✅ Everything in "Sending access"
- ⚠️ Create/delete API keys
- ⚠️ Add/remove domains
- ⚠️ Access billing
- ⚠️ Manage account settings

**Best for:** Admin tasks, account management

**Security Risk:** If leaked, attacker could control your entire Resend account

---

## Security Best Practices

### ✅ DO:

1. **Use "Sending access"** for SMTP
   - Principle of least privilege
   - Limits damage if key is leaked

2. **Create separate keys** for different purposes
   - Edge Functions: One key
   - SMTP: Different key
   - Manual testing: Another key

3. **Use descriptive names**
   - `WasteDB-SMTP-Email-Confirmation` ✅
   - `Production-API-Key` ✅
   - `Key-1` ❌

4. **Limit by domain** if possible
   - Restricts key to specific domain
   - Extra security layer

### ❌ DON'T:

1. **Don't use "Full access"** unless necessary
2. **Don't share keys** between services
3. **Don't commit keys** to GitHub
4. **Don't store keys** in plain text files
5. **Don't screenshot keys** (security risk)

---

## Troubleshooting

### "I didn't copy the key in time!"

**Solution:** Delete the key and create a new one

```
1. Go to: https://resend.com/api-keys
2. Find: WasteDB-SMTP-Email-Confirmation
3. Click: [Delete] or [•••] menu > Delete
4. Confirm deletion
5. Create a new key (follow steps above)
```

### "I'm not sure which permission I selected"

**Solution:** Check the API keys list

```
1. Go to: https://resend.com/api-keys
2. Look at the "Permission" column
3. It shows: "Sending" or "Full access"
4. If wrong: Delete and recreate
```

### "Can I change the permission later?"

**Answer:** No - you must create a new key

Resend doesn't allow editing permissions for security reasons.

### "How many API keys can I have?"

**Answer:** Unlimited

Create as many as needed for different purposes.

---

## Key Management Tips

### Organize Your Keys

**Recommended naming convention:**
```
[Project]-[Purpose]-[Environment]

Examples:
✅ WasteDB-SMTP-Production
✅ WasteDB-EdgeFunctions-Production
✅ WasteDB-Testing-Development
✅ WasteDB-MagicLinks-Production
```

### Rotate Keys Periodically

**Security best practice:**
```
Every 3-6 months:
1. Create new API key
2. Update Supabase SMTP settings
3. Test email sending
4. Delete old key
```

### Track Key Usage

**Monitor in Resend Dashboard:**
```
1. Go to: https://resend.com/emails
2. Filter by API key (if multiple)
3. Check for unusual activity
4. Verify expected email volume
```

---

## Quick Reference

### What You Need for SMTP

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Pass: [Your NEW API key - Sending access]
```

### Creating the Key

```
1. https://resend.com/api-keys
2. Create API Key
3. Name: WasteDB-SMTP-Email-Confirmation
4. Permission: Sending access
5. Domain: wastefull.org
6. Create
7. Copy key immediately
8. Save somewhere safe
```

### Using the Key

```
1. Copy the key
2. Go to Supabase Dashboard
3. Project Settings > Auth > SMTP Settings
4. Paste into SMTP Password
5. Save
6. Test with "Send Test Email"
```

---

## Summary

✅ **Yes, create a new API key** (can't retrieve existing one)  
✅ **Use "Sending access"** permission (not Full access)  
✅ **Copy the key immediately** (you won't see it again)  
✅ **Keep it safe** until you paste into Supabase  
✅ **Test after setup** to verify it works  

---

## Next Steps

Now that you have your API key:

1. ✅ API key created and copied
2. ⏭️ Follow `/RESEND_SETUP_QUICK_GUIDE.md` to configure Supabase
3. ⏭️ Test email confirmation flow
4. ⏭️ Deploy to production

---

## Related Documentation

- **Quick Setup**: `/RESEND_SETUP_QUICK_GUIDE.md`
- **Full SMTP Setup**: `/RESEND_SMTP_SETUP.md`
- **Config Values**: `/SMTP_CONFIG_VALUES.md`
- **Email Confirmation**: `/EMAIL_CONFIRMATION_SETUP.md`

---

**Questions?** Contact natto@wastefull.org  
**Resend Docs**: https://resend.com/docs/api-reference/api-keys  
**Resend Support**: support@resend.com

---

**Last Updated**: October 22, 2025  
**Status**: Ready to Use  
**Difficulty**: Easy (5 minutes)
