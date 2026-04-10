# WasteDB Privacy Policy

Last updated: April 10, 2026

This policy explains what personally identifiable information (PII) WasteDB receives through Supabase authentication and Google OAuth, and how cookies are used.

## Scope

This document covers:

- WasteDB web app behavior on db.wastefull.org
- Supabase Auth data used by WasteDB
- Google OAuth data as mediated by Supabase Auth
- First-party cookies and browser storage used by the app

This document does not replace legal advice.

## Data Controller

Wastefull, Inc. operates WasteDB.

## What PII We Receive

### 1) Direct auth input sent by users to WasteDB APIs

When users authenticate with email/password or magic link, the app sends:

- Email address
- Password (email/password sign-in and sign-up only)
- Optional display name (sign-up only)

These are sent to the WasteDB edge function auth endpoints.

### 2) Supabase Auth user data WasteDB receives and uses

After successful auth flows, WasteDB receives and/or stores the following user fields.

| Field                            | Source                                         | Purpose                                   | Retention behavior                        |
| -------------------------------- | ---------------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| user.id                          | Supabase Auth user object                      | Internal identity key                     | Persisted in auth records/session objects |
| user.email                       | Supabase Auth user object                      | Account identity, sign-in, authorization  | Persisted in auth records/session objects |
| user name (derived)              | Supabase user metadata and/or email local part | Display name in UI/profile defaults       | Persisted in profile/session display data |
| email_confirmed_at (status only) | Supabase Auth user object                      | Blocks unverified accounts                | Checked at sign-in/exchange time          |
| app_metadata.provider            | Supabase Auth user app metadata                | Verifies OAuth provider                   | Checked during OAuth exchange             |
| app_metadata.providers[]         | Supabase Auth user app metadata                | Verifies account includes Google provider | Checked during OAuth exchange             |

### 3) Additional metadata WasteDB writes into Supabase user metadata

For email sign-up and magic-link account creation, WasteDB writes these metadata fields:

- name
- isOrgEmail (boolean derived from email domain policy)
- signupIp (IP fragment derived from request client identifier; email/password sign-up flow)
- signupTimestamp
- authMethod (magic-link flow)

### 4) Google OAuth-derived data

WasteDB uses Google sign-in through Supabase OAuth.

When exchanging a Supabase OAuth session for a WasteDB session, WasteDB validates and uses:

- Supabase user ID
- Supabase account email
- Provider metadata showing Google as the provider
- Email verification status

WasteDB restricts Google OAuth sign-in to verified @wastefull.org accounts.

Important implementation detail:

- WasteDB receives OAuth identity data through Supabase Auth (not directly from Google APIs).
- WasteDB code currently checks provider metadata and email identity/verification for authorization.

## Sessions, Cookies, and Browser Storage

## First-party cookies

WasteDB sets one first-party cookie for authentication:

- wastedb_session
  - Purpose: persists your signed-in session across browser restarts
  - Type: authentication cookie — functionally necessary
  - HttpOnly: yes (not readable by JavaScript; reduces XSS risk)
  - Secure: yes (HTTPS only)
  - SameSite: None (required for cross-origin requests between the app domain and the API)
  - Max-Age: 7 days, matching the server-side session expiry
  - Path: /

No tracking or analytics cookies are set.

## Browser storage

In addition to the auth cookie, WasteDB uses browser-managed storage:

- sessionStorage key wastedb_access_token — copy of the session token kept in memory for the current tab; cleared when the tab closes
- sessionStorage key wastedb_user — minimal signed-in user object (id, email, display name) for UI state; cleared when the tab closes
- localStorage key cookie-consent — records that the user has acknowledged this notice

## OAuth provider cookies

During Google OAuth and Supabase hosted auth redirects, Google and/or Supabase domains may set their own cookies for login/session security on their domains. These are controlled by those providers, not by WasteDB application code.

## Why We Process This Data

We process this data to:

- Authenticate users
- Authorize access by role
- Secure sign-in and prevent abuse
- Maintain active sessions
- Provide basic profile/display behavior

## Sharing

WasteDB relies on service providers to process auth-related data:

- Supabase (authentication/session infrastructure)
- Google (OAuth identity provider, when Google sign-in is used)

WasteDB does not use this auth metadata for advertising.

## Security Notes

WasteDB implements:

- Rate limits on auth endpoints
- Email verification checks
- Provider/domain checks for Google OAuth
- Server-side session expiry controls

## Your Choices

You can:

- Use email/password or magic link flows
- Use Google OAuth only if your account meets domain restrictions
- Sign out to clear in-app sessionStorage auth data
- Clear browser cookies/localStorage/sessionStorage in your browser settings

## Contact

For privacy questions related to WasteDB, contact Wastefull, Inc. through official project channels.
