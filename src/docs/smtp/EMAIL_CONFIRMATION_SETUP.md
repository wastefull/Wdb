# Email Confirmation Setup Guide

## Overview

WasteDB now requires users to confirm their email addresses before they can sign in for the first time. This adds an important security layer to prevent fake accounts and verify email ownership.

## How It Works

### Sign-Up Flow

1. User creates an account with email and password
2. Account is created but email is **not confirmed**
3. Supabase automatically sends a confirmation email
4. User clicks the confirmation link in their email
5. User can now sign in with their credentials

### Sign-In Flow

1. User enters email and password
2. System checks if email is confirmed
3. If **not confirmed**: Error message shown asking user to check email
4. If **confirmed**: User is signed in successfully

### Magic Link Flow

- Magic links **bypass** email confirmation (the act of clicking the magic link IS the confirmation)
- Users created via magic link can sign in immediately

## Supabase Email Configuration

### Prerequisites

You must configure email settings in your Supabase project before email confirmation will work.

### Configuration Steps

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your WasteDB project

2. **Configure Email Provider**
   - Go to: **Authentication** > **Providers** > **Email**
   - Enable "Confirm email" toggle
   - Save changes

3. **Set Up SMTP (Recommended for Production)**

   Option A: Use Supabase's built-in email (development only):
   - No configuration needed
   - Limited to 3 emails per hour
   - Emails may go to spam

   Option B: Configure custom SMTP (recommended):
   - Go to: **Project Settings** > **Auth** > **SMTP Settings**
   - Configure your email provider (e.g., SendGrid, AWS SES, Resend)

   Example for Resend:

   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 587
   SMTP User: resend
   SMTP Pass: [Your Resend API Key]
   Sender email: noreply@yourdomain.com
   Sender name: WasteDB
   ```

4. **Customize Email Templates**
   - Go to: **Authentication** > **Email Templates**
   - Select "Confirm signup" template
   - Customize the email content (optional)

   Default template variables available:
   - `{{ .ConfirmationURL }}` - The confirmation link
   - `{{ .SiteURL }}` - Your site URL
   - `{{ .Token }}` - Confirmation token

5. **Set Redirect URL**
   - Go to: **Authentication** > **URL Configuration**
   - Set "Site URL" to your production domain (e.g., `https://wastedb.app`)
   - Add redirect URLs to allowed list
   - For development, add: `http://localhost:3000`

### Example Email Template

```html
<h2>Confirm your email</h2>
<p>Welcome to WasteDB!</p>
<p>Click the link below to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email Address</a></p>
<p>If you didn't create this account, you can safely ignore this email.</p>
```

## Testing Email Confirmation

### Development Testing

1. **Use a Real Email Address**
   - Don't use temporary/disposable email services
   - Use your personal email for testing

2. **Check Spam Folder**
   - Confirmation emails may go to spam initially
   - Mark as "Not Spam" to train filters

3. **Monitor Supabase Logs**
   - Go to: **Authentication** > **Logs**
   - Check for email sending errors

### Test the Flow

```bash
# 1. Sign up with a new account
POST /auth/signup
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "name": "Test User"
}

# Expected Response:
{
  "user": { ... },
  "message": "Account created! Please check your email to confirm your account before signing in."
}

# 2. Try to sign in (should fail)
POST /auth/signin
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}

# Expected Response (403):
{
  "error": "Please confirm your email address before signing in...",
  "code": "EMAIL_NOT_CONFIRMED"
}

# 3. Click confirmation link in email

# 4. Try to sign in again (should succeed)
POST /auth/signin
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}

# Expected Response (200):
{
  "access_token": "...",
  "user": { ... }
}
```

## Troubleshooting

### Issue: Users not receiving confirmation emails

**Solutions:**

1. Check SMTP configuration in Supabase dashboard
2. Verify email provider credentials are correct
3. Check spam/junk folders
4. Verify sender email is from a domain you control
5. Check Supabase Auth logs for email errors

### Issue: Confirmation link doesn't work

**Solutions:**

1. Check "Site URL" in Supabase Auth settings
2. Verify redirect URLs are properly configured
3. Ensure token hasn't expired (default: 24 hours)
4. Check browser console for CORS errors

### Issue: Want to manually confirm a user

**SQL Query (run in Supabase SQL Editor):**

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

Or via Admin API:

```javascript
// In server code
await supabase.auth.admin.updateUserById(userId, {
  email_confirm: true
});
```

## Resending Confirmation Emails

To resend a confirmation email, users can:

1. **Use Password Reset Flow** (temporary workaround):
   - Click "Forgot Password?"
   - Enter their email
   - This will send a new confirmation link

2. **Contact Admin** (for manual confirmation)

### Future Enhancement

Consider adding a "Resend Confirmation" button in the UI that calls:

```typescript
// API endpoint to add
app.post(
  "/make-server-17cae920/auth/resend-confirmation",
  async (c) => {
    const { email } = await c.req.json();
    // Implementation to resend confirmation email
  },
);
```

## Admin Account Setup

For admin accounts (e.g., natto@wastefull.org):

1. **Create account normally** via signup
2. **Manually confirm** in Supabase dashboard if needed:
   - Go to: **Authentication** > **Users**
   - Find the user
   - Click "..." menu > "Confirm Email"

3. **Or use SQL**:

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'natto@wastefull.org';
```

## Security Considerations

### Why Email Confirmation?

1. **Prevents Fake Accounts**: Verifies users control the email address
2. **Reduces Spam**: Bots can't easily create accounts
3. **Account Recovery**: Ensures password reset emails reach real owners
4. **Compliance**: Required for GDPR/privacy regulations
5. **User Trust**: Industry standard practice

### Best Practices

1. ✅ Use HTTPS for confirmation URLs
2. ✅ Set reasonable token expiry (24 hours default)
3. ✅ Don't reveal if email exists (security)
4. ✅ Log confirmation attempts
5. ✅ Rate limit resend requests
6. ✅ Use professional email provider (not default Supabase)

## Environment Variables

No new environment variables are required. The system uses existing Supabase configuration:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin service key

## Migration Notes

### Existing Users

If you have existing users created before this change:

1. They were auto-confirmed (`email_confirm: true`)
2. They can continue signing in normally
3. No action needed

### New Users (After This Update)

1. Must confirm email before first sign-in
2. Cannot sign in until email is confirmed
3. Magic link users are auto-confirmed

## Support

For issues or questions:

1. Check Supabase Auth logs
2. Review this guide's troubleshooting section
3. Contact: natto@wastefull.org
4. Create an issue in the project repository

---

**Last Updated**: October 22, 2025  
**Version**: 1.0  
**Author**: WasteDB Team