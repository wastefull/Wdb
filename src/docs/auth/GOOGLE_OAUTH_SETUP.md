# Google OAuth Setup and Account Linking

**Updated:** April 7, 2026
**Status:** Implemented in code, requires Supabase dashboard configuration

---

## Goal

Enable organization members to authenticate using Google OAuth with verified `@wastefull.org` accounts, while preserving existing WasteDB roles and contribution history.

---

## What Changed in WasteDB

1. Frontend now offers `Continue with Google (@wastefull.org)` in the auth view.
2. OAuth callback uses Supabase session exchange into WasteDB custom session tokens.
3. Backend endpoint added: `POST /auth/exchange-supabase-session`
4. Backend endpoint added (admin-only): `POST /auth/link-email-alias`
5. Alias mapping key format in KV: `auth_email_alias:<email>` -> `<target_user_id>`

This keeps your existing dual-token API pattern and role model intact.

---

## Required Supabase Configuration

Complete all steps in the Supabase Dashboard for project `bdvfwjmaufjeqmxphmtv`.

### 1. Enable Google provider

1. Go to: `Authentication` -> `Providers` -> `Google`
2. Toggle `Enable sign in with Google`
3. Paste Google OAuth Client ID and Secret
4. Save

### 2. Configure redirect URLs

In Supabase Auth URL settings, add the following redirect URLs:

1. `https://db.wastefull.org`
2. `http://localhost:3000`
3. Any additional local host/port used by your team

### 3. Configure Google OAuth consent and authorized redirect URI

In Google Cloud Console (same OAuth client):

1. Authorized JavaScript origins:
   - `https://db.wastefull.org`
   - `http://localhost:3000`
2. Authorized redirect URIs:
   - `https://bdvfwjmaufjeqmxphmtv.supabase.co/auth/v1/callback`

### 4. Recommended Supabase Auth settings

1. Keep email confirmation enabled
2. Keep PKCE flow enabled (default in modern Supabase clients)
3. Keep existing magic-link auth enabled for fallback and account recovery

---

## Org Domain Enforcement

Google OAuth sign-in is enforced server-side in WasteDB:

1. OAuth provider must be Google
2. Supabase email must be verified
3. Email must match `@wastefull.org`

Note: Google `hd=wastefull.org` is used as a UX hint only. Server-side checks are authoritative.

---

## Linking an Org Google Email to an Existing Non-Org Contributor Account

Use this for the contributor who has historical data under a non-org email account.

### Pre-check

1. Identify the target WasteDB account user ID (the existing account that already has elevated role/history).
2. Confirm the org Google email address that should map to that account.

### Admin API call

Call the admin-only route while authenticated as an admin user:

```bash
curl -X POST "https://bdvfwjmaufjeqmxphmtv.supabase.co/functions/v1/make-server-17cae920/auth/link-email-alias" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "X-Session-Token: <ADMIN_WASTEDB_SESSION_TOKEN>" \
  -d '{
    "aliasEmail": "person@wastefull.org",
    "targetUserId": "existing-user-uuid"
  }'
```

Alternative payload using target email lookup:

```json
{
  "aliasEmail": "person@wastefull.org",
  "targetEmail": "legacy-non-org@example.com"
}
```

### Result

When that person signs in with Google using `person@wastefull.org`, WasteDB session resolves to the existing target user ID, preserving:

1. Existing role (admin/staff/user)
2. Historical contributions and ownership
3. Existing profile and permissions logic

---

## Validation Checklist

1. Google button appears on auth screen in production and local.
2. Google sign-in with non-org email is rejected.
3. Google sign-in with org email succeeds.
4. Linked alias user lands on the existing account (same user ID in API responses).
5. Existing admin/staff permissions still work.
6. Magic link flow still works unchanged.

---

## Operational Notes

1. Alias mapping is explicit and admin-managed (not automatic).
2. Keep a small internal runbook of alias mappings for auditability.
3. If a user changes org email, update the alias key accordingly.
4. For rollback, remove or update the `auth_email_alias:<email>` key in KV.
